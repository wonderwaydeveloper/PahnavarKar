package expo.modules.pahnavarfilestorage

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException

class PahnavarFileStorageModule : Module() {
  private val context: Context
    get() = appContext.reactContext
      ?: throw IllegalStateException("The Android application context is unavailable.")

  override fun definition() = ModuleDefinition {
    Name("PahnavarFileStorage")

    AsyncFunction("saveToDownloadsAsync") {
      sourceUri: String,
      requestedFileName: String,
      mimeType: String,
      requestedFolderName: String ->
      withContext(Dispatchers.IO) {
        saveToDownloads(
          Uri.parse(sourceUri),
          sanitizeFileName(requestedFileName),
          sanitizeMimeType(mimeType),
          sanitizePathSegment(requestedFolderName, "folder name")
        )
      }
    }
  }

  private fun saveToDownloads(
    sourceUri: Uri,
    fileName: String,
    mimeType: String,
    folderName: String
  ): String {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      return saveWithMediaStore(sourceUri, fileName, mimeType, folderName)
    } else {
      return saveToLegacyDownloads(sourceUri, fileName, folderName)
    }
  }

  private fun saveWithMediaStore(
    sourceUri: Uri,
    fileName: String,
    mimeType: String,
    folderName: String
  ): String {
    val resolver = context.contentResolver
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
      put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
      put(
        MediaStore.MediaColumns.RELATIVE_PATH,
        "${Environment.DIRECTORY_DOWNLOADS}/$folderName"
      )
      put(MediaStore.MediaColumns.IS_PENDING, 1)
    }
    val destinationUri = resolver.insert(
      MediaStore.Downloads.EXTERNAL_CONTENT_URI,
      values
    ) ?: throw IOException("Android could not create the file in Downloads.")

    try {
      val input = resolver.openInputStream(sourceUri)
        ?: throw IOException("The source file could not be opened.")
      input.use { source ->
        val output = resolver.openOutputStream(destinationUri)
          ?: throw IOException("The destination file could not be opened.")
        output.use { destination -> source.copyTo(destination) }
      }
      val completedValues = ContentValues().apply {
        put(MediaStore.MediaColumns.IS_PENDING, 0)
      }
      if (resolver.update(destinationUri, completedValues, null, null) == 0) {
        throw IOException("Android could not finalize the file in Downloads.")
      }
    } catch (error: Exception) {
      resolver.delete(destinationUri, null, null)
      throw error
    }
    return destinationUri.toString()
  }

  @Suppress("DEPRECATION")
  private fun saveToLegacyDownloads(
    sourceUri: Uri,
    fileName: String,
    folderName: String
  ): String {
    if (context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
      != PackageManager.PERMISSION_GRANTED
    ) {
      throw SecurityException("Storage permission is required to save this PDF.")
    }

    val downloadsDirectory = Environment.getExternalStoragePublicDirectory(
      Environment.DIRECTORY_DOWNLOADS
    )
    val appDirectory = File(downloadsDirectory, folderName)
    if (!appDirectory.exists() && !appDirectory.mkdirs()) {
      throw IOException("Android could not create the Downloads/$folderName folder.")
    }

    val destination = File(appDirectory, fileName)
    val input = context.contentResolver.openInputStream(sourceUri)
      ?: throw IOException("The source file could not be opened.")
    try {
      input.use { source ->
        destination.outputStream().use { target -> source.copyTo(target) }
      }
    } catch (error: Exception) {
      destination.delete()
      throw error
    }
    return Uri.fromFile(destination).toString()
  }

  private fun sanitizeFileName(fileName: String): String {
    val safeName = fileName.trim()
    if (safeName.isEmpty() || safeName == "." || safeName == ".." ||
      safeName.contains('/') || safeName.contains('\\') || safeName.contains('\u0000')
    ) {
      throw IllegalArgumentException("The file name must be a single path segment.")
    }
    return safeName
  }

  private fun sanitizeMimeType(mimeType: String): String {
    val safeMimeType = mimeType.trim()
    if (!Regex("^[A-Za-z0-9!#$&^_.+*-]+/[A-Za-z0-9!#$&^_.+*-]+$").matches(safeMimeType)) {
      throw IllegalArgumentException("The MIME type is invalid.")
    }
    return safeMimeType
  }

  private fun sanitizePathSegment(value: String, label: String): String {
    val safeValue = value.trim()
    if (safeValue.isEmpty() || safeValue == "." || safeValue == ".." ||
      !Regex("^[A-Za-z0-9 _.-]+$").matches(safeValue)
    ) {
      throw IllegalArgumentException("The $label must be a single path segment.")
    }
    return safeValue
  }
}
