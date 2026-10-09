import type { SQLiteDatabase } from 'expo-sqlite';

const LEGAL_SCHEMA_MIGRATION = '001_create_legal_data_tables';
const LEGAL_TITLE_STRUCTURE_MIGRATION = '002_add_legal_title_structure_flags';
const LEGAL_TITLE_TOPIC_REQUIRES_CHAPTER_MIGRATION = '003_topics_require_chapters';
const LEGAL_ARTICLE_HIERARCHY_MIGRATION = '004_add_legal_article_hierarchy';
const LEGAL_ARTICLE_ANCESTRY_MIGRATION = '005_derive_article_ancestry_from_parent_ids';

export async function runLegalMigrations(database: SQLiteDatabase): Promise<void> {
    let transactionStarted = false;

    try {
        await database.execAsync('BEGIN IMMEDIATE;');
        transactionStarted = true;

        await database.execAsync(`CREATE TABLE IF NOT EXISTS legal_data_migrations (
            migration_id TEXT PRIMARY KEY NOT NULL,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );`);

        const migrationStatement = await database.prepareAsync(
            'SELECT migration_id FROM legal_data_migrations WHERE migration_id = ?;'
        );

        let migrationApplied: boolean;
        try {
            const result = await migrationStatement.executeAsync<{ migration_id: string }>([
                LEGAL_SCHEMA_MIGRATION,
            ]);
            migrationApplied = (await result.getFirstAsync()) !== null;
        } finally {
            await migrationStatement.finalizeAsync();
        }

        if (!migrationApplied) {
            await database.execAsync(`
                CREATE TABLE regulation_categories (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL UNIQUE CHECK (length(trim(title)) > 0),
                    sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order > 0)
                );

                CREATE TABLE legal_titles (
                    id INTEGER PRIMARY KEY,
                    regulation_category_id INTEGER NOT NULL,
                    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
                    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
                    UNIQUE (regulation_category_id, sort_order),
                    UNIQUE (regulation_category_id, title),
                    FOREIGN KEY (regulation_category_id)
                        REFERENCES regulation_categories(id) ON DELETE CASCADE
                );

                CREATE TABLE legal_chapters (
                    id INTEGER PRIMARY KEY,
                    legal_title_id INTEGER NOT NULL,
                    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
                    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
                    UNIQUE (legal_title_id, sort_order),
                    FOREIGN KEY (legal_title_id)
                        REFERENCES legal_titles(id) ON DELETE CASCADE
                );

                CREATE TABLE legal_topics (
                    id INTEGER PRIMARY KEY,
                    chapter_id INTEGER NOT NULL,
                    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
                    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
                    UNIQUE (chapter_id, sort_order),
                    FOREIGN KEY (chapter_id)
                        REFERENCES legal_chapters(id) ON DELETE CASCADE
                );

                CREATE TABLE legal_articles (
                    id INTEGER PRIMARY KEY,
                    legal_title_id INTEGER NOT NULL,
                    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
                    body TEXT NOT NULL CHECK (length(trim(body)) > 0),
                    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
                    UNIQUE (legal_title_id, sort_order),
                    FOREIGN KEY (legal_title_id)
                        REFERENCES legal_titles(id) ON DELETE CASCADE
                );

                CREATE TABLE legal_footnotes (
                    id INTEGER PRIMARY KEY,
                    article_id INTEGER NOT NULL,
                    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
                    body TEXT NOT NULL CHECK (length(trim(body)) > 0),
                    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
                    UNIQUE (article_id, sort_order),
                    FOREIGN KEY (article_id)
                        REFERENCES legal_articles(id) ON DELETE CASCADE
                );

                CREATE INDEX legal_titles_category_order_idx
                    ON legal_titles(regulation_category_id, sort_order);
                CREATE INDEX legal_chapters_title_order_idx
                    ON legal_chapters(legal_title_id, sort_order);
                CREATE INDEX legal_topics_chapter_order_idx
                    ON legal_topics(chapter_id, sort_order);
                CREATE INDEX legal_articles_title_order_idx
                    ON legal_articles(legal_title_id, sort_order);
                CREATE INDEX legal_footnotes_article_order_idx
                    ON legal_footnotes(article_id, sort_order);
            `);

            const recordMigrationStatement = await database.prepareAsync(
                'INSERT INTO legal_data_migrations (migration_id) VALUES (?);'
            );
            try {
                await recordMigrationStatement.executeAsync([LEGAL_SCHEMA_MIGRATION]);
            } finally {
                await recordMigrationStatement.finalizeAsync();
            }
        }

        const structureMigrationStatement = await database.prepareAsync(
            'SELECT migration_id FROM legal_data_migrations WHERE migration_id = ?;'
        );

        let structureMigrationApplied: boolean;
        try {
            const result = await structureMigrationStatement.executeAsync<{ migration_id: string }>([
                LEGAL_TITLE_STRUCTURE_MIGRATION,
            ]);
            structureMigrationApplied = (await result.getFirstAsync()) !== null;
        } finally {
            await structureMigrationStatement.finalizeAsync();
        }

        if (!structureMigrationApplied) {
            await database.execAsync(`
                ALTER TABLE legal_titles
                    ADD COLUMN has_chapters INTEGER
                    CHECK (has_chapters IS NULL OR has_chapters IN (0, 1));

                ALTER TABLE legal_titles
                    ADD COLUMN has_topics INTEGER
                    CHECK (has_topics IS NULL OR has_topics IN (0, 1));
            `);

            const recordStructureMigrationStatement = await database.prepareAsync(
                'INSERT INTO legal_data_migrations (migration_id) VALUES (?);'
            );
            try {
                await recordStructureMigrationStatement.executeAsync([
                    LEGAL_TITLE_STRUCTURE_MIGRATION,
                ]);
            } finally {
                await recordStructureMigrationStatement.finalizeAsync();
            }
        }

        const topicChapterMigrationStatement = await database.prepareAsync(
            'SELECT migration_id FROM legal_data_migrations WHERE migration_id = ?;'
        );

        let topicChapterMigrationApplied: boolean;
        try {
            const result = await topicChapterMigrationStatement.executeAsync<{ migration_id: string }>([
                LEGAL_TITLE_TOPIC_REQUIRES_CHAPTER_MIGRATION,
            ]);
            topicChapterMigrationApplied = (await result.getFirstAsync()) !== null;
        } finally {
            await topicChapterMigrationStatement.finalizeAsync();
        }

        if (!topicChapterMigrationApplied) {
            await database.execAsync(`
                CREATE TRIGGER legal_titles_topics_require_chapters_insert
                BEFORE INSERT ON legal_titles
                WHEN NEW.has_topics = 1 AND NEW.has_chapters IS NOT 1
                BEGIN
                    SELECT RAISE(ABORT, 'A legal title cannot have topics without chapters.');
                END;

                CREATE TRIGGER legal_titles_topics_require_chapters_update
                BEFORE UPDATE OF has_chapters, has_topics ON legal_titles
                WHEN NEW.has_topics = 1 AND NEW.has_chapters IS NOT 1
                BEGIN
                    SELECT RAISE(ABORT, 'A legal title cannot have topics without chapters.');
                END;
            `);

            const recordTopicChapterMigrationStatement = await database.prepareAsync(
                'INSERT INTO legal_data_migrations (migration_id) VALUES (?);'
            );
            try {
                await recordTopicChapterMigrationStatement.executeAsync([
                    LEGAL_TITLE_TOPIC_REQUIRES_CHAPTER_MIGRATION,
                ]);
            } finally {
                await recordTopicChapterMigrationStatement.finalizeAsync();
            }
        }

        const articleHierarchyMigrationStatement = await database.prepareAsync(
            'SELECT migration_id FROM legal_data_migrations WHERE migration_id = ?;'
        );

        let articleHierarchyMigrationApplied: boolean;
        try {
            const result = await articleHierarchyMigrationStatement.executeAsync<{ migration_id: string }>([
                LEGAL_ARTICLE_HIERARCHY_MIGRATION,
            ]);
            articleHierarchyMigrationApplied = (await result.getFirstAsync()) !== null;
        } finally {
            await articleHierarchyMigrationStatement.finalizeAsync();
        }

        if (!articleHierarchyMigrationApplied) {
            await database.execAsync(`
                ALTER TABLE legal_articles
                    ADD COLUMN chapter_id INTEGER
                    REFERENCES legal_chapters(id) ON DELETE CASCADE;

                ALTER TABLE legal_articles
                    ADD COLUMN topic_id INTEGER
                    REFERENCES legal_topics(id) ON DELETE CASCADE;

                CREATE INDEX legal_articles_chapter_order_idx
                    ON legal_articles(chapter_id, sort_order);
                CREATE INDEX legal_articles_topic_order_idx
                    ON legal_articles(topic_id, sort_order);

                CREATE TRIGGER legal_articles_validate_parent_insert
                BEFORE INSERT ON legal_articles
                WHEN
                    (NEW.chapter_id IS NOT NULL AND NEW.topic_id IS NOT NULL)
                    OR (
                        NEW.chapter_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.id = NEW.chapter_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                                AND NOT EXISTS (
                                    SELECT 1
                                    FROM legal_topics AS topic
                                    WHERE topic.chapter_id = chapter.id
                                )
                        )
                    )
                    OR (
                        NEW.topic_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_topics AS topic
                            JOIN legal_chapters AS chapter ON chapter.id = topic.chapter_id
                            WHERE topic.id = NEW.topic_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                        )
                    )
                    OR (
                        NEW.chapter_id IS NULL
                        AND NEW.topic_id IS NULL
                        AND (
                            EXISTS (
                                SELECT 1
                                FROM legal_chapters AS chapter
                                WHERE chapter.legal_title_id = NEW.legal_title_id
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM legal_titles AS legal_title
                                WHERE legal_title.id = NEW.legal_title_id
                                    AND legal_title.has_chapters = 1
                            )
                        )
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Article parent does not match its legal title hierarchy.');
                END;

                CREATE TRIGGER legal_articles_validate_parent_update
                BEFORE UPDATE OF legal_title_id, chapter_id, topic_id ON legal_articles
                WHEN
                    (NEW.chapter_id IS NOT NULL AND NEW.topic_id IS NOT NULL)
                    OR (
                        NEW.chapter_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.id = NEW.chapter_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                                AND NOT EXISTS (
                                    SELECT 1
                                    FROM legal_topics AS topic
                                    WHERE topic.chapter_id = chapter.id
                                )
                        )
                    )
                    OR (
                        NEW.topic_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_topics AS topic
                            JOIN legal_chapters AS chapter ON chapter.id = topic.chapter_id
                            WHERE topic.id = NEW.topic_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                        )
                    )
                    OR (
                        NEW.chapter_id IS NULL
                        AND NEW.topic_id IS NULL
                        AND (
                            EXISTS (
                                SELECT 1
                                FROM legal_chapters AS chapter
                                WHERE chapter.legal_title_id = NEW.legal_title_id
                            )
                            OR EXISTS (
                                SELECT 1
                                FROM legal_titles AS legal_title
                                WHERE legal_title.id = NEW.legal_title_id
                                    AND legal_title.has_chapters = 1
                            )
                        )
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Article parent does not match its legal title hierarchy.');
                END;

                CREATE TRIGGER legal_articles_prevent_topics_with_direct_chapter_articles
                BEFORE INSERT ON legal_topics
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_articles AS article
                    WHERE article.chapter_id = NEW.chapter_id
                )
                BEGIN
                    SELECT RAISE(ABORT, 'Move chapter articles to a topic before adding topics.');
                END;

                CREATE TRIGGER legal_articles_prevent_topic_update_with_direct_chapter_articles
                BEFORE UPDATE OF chapter_id ON legal_topics
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_articles AS article
                    WHERE article.chapter_id = NEW.chapter_id
                )
                BEGIN
                    SELECT RAISE(ABORT, 'Move chapter articles to a topic before adding topics.');
                END;

                CREATE TRIGGER legal_chapters_validate_title_insert
                BEFORE INSERT ON legal_chapters
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_titles AS legal_title
                    WHERE legal_title.id = NEW.legal_title_id
                        AND legal_title.has_chapters = 0
                )
                BEGIN
                    SELECT RAISE(ABORT, 'This legal title is marked as having no chapters.');
                END;

                CREATE TRIGGER legal_chapters_validate_title_update
                BEFORE UPDATE OF legal_title_id ON legal_chapters
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_titles AS legal_title
                    WHERE legal_title.id = NEW.legal_title_id
                        AND legal_title.has_chapters = 0
                )
                BEGIN
                    SELECT RAISE(ABORT, 'This legal title is marked as having no chapters.');
                END;

                CREATE TRIGGER legal_topics_validate_chapter_insert
                BEFORE INSERT ON legal_topics
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_chapters AS chapter
                    JOIN legal_titles AS legal_title ON legal_title.id = chapter.legal_title_id
                    WHERE chapter.id = NEW.chapter_id
                        AND (
                            legal_title.has_chapters = 0
                            OR legal_title.has_topics = 0
                        )
                )
                BEGIN
                    SELECT RAISE(ABORT, 'This legal title is marked as having no chapters or topics.');
                END;

                CREATE TRIGGER legal_topics_validate_chapter_update
                BEFORE UPDATE OF chapter_id ON legal_topics
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_chapters AS chapter
                    JOIN legal_titles AS legal_title ON legal_title.id = chapter.legal_title_id
                    WHERE chapter.id = NEW.chapter_id
                        AND (
                            legal_title.has_chapters = 0
                            OR legal_title.has_topics = 0
                        )
                )
                BEGIN
                    SELECT RAISE(ABORT, 'This legal title is marked as having no chapters or topics.');
                END;

                CREATE TRIGGER legal_titles_prevent_structure_flag_conflict
                BEFORE UPDATE OF has_chapters, has_topics ON legal_titles
                WHEN
                    (NEW.has_topics = 1 AND NEW.has_chapters IS NOT 1)
                    OR (
                        NEW.has_chapters = 0
                        AND EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.legal_title_id = NEW.id
                        )
                    )
                    OR (
                        NEW.has_topics = 0
                        AND EXISTS (
                            SELECT 1
                            FROM legal_topics AS topic
                            JOIN legal_chapters AS chapter ON chapter.id = topic.chapter_id
                            WHERE chapter.legal_title_id = NEW.id
                        )
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Legal title structure flags conflict with its chapters or topics.');
                END;

                CREATE TRIGGER legal_articles_prevent_chapters_with_direct_title_articles
                BEFORE INSERT ON legal_chapters
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_articles AS article
                    WHERE article.legal_title_id = NEW.legal_title_id
                        AND article.chapter_id IS NULL
                        AND article.topic_id IS NULL
                )
                BEGIN
                    SELECT RAISE(ABORT, 'Move direct legal-title articles before adding chapters.');
                END;

                CREATE TRIGGER legal_articles_prevent_chapter_update_with_direct_title_articles
                BEFORE UPDATE OF legal_title_id ON legal_chapters
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_articles AS article
                    WHERE article.legal_title_id = NEW.legal_title_id
                        AND article.chapter_id IS NULL
                        AND article.topic_id IS NULL
                )
                BEGIN
                    SELECT RAISE(ABORT, 'Move direct legal-title articles before adding chapters.');
                END;

                CREATE TRIGGER legal_articles_prevent_chapter_reparent_with_articles
                BEFORE UPDATE OF legal_title_id ON legal_chapters
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_articles AS article
                    WHERE article.chapter_id = OLD.id
                        AND article.legal_title_id <> NEW.legal_title_id
                )
                BEGIN
                    SELECT RAISE(ABORT, 'Chapter cannot be reassigned while it has articles.');
                END;

                CREATE TRIGGER legal_articles_prevent_topic_reparent_with_articles
                BEFORE UPDATE OF chapter_id ON legal_topics
                WHEN EXISTS (
                    SELECT 1
                    FROM legal_articles AS article
                    WHERE article.topic_id = OLD.id
                        AND article.legal_title_id <> (
                            SELECT chapter.legal_title_id
                            FROM legal_chapters AS chapter
                            WHERE chapter.id = NEW.chapter_id
                        )
                )
                BEGIN
                    SELECT RAISE(ABORT, 'Topic cannot be reassigned while it has articles.');
                END;
            `);

            const recordArticleHierarchyMigrationStatement = await database.prepareAsync(
                'INSERT INTO legal_data_migrations (migration_id) VALUES (?);'
            );
            try {
                await recordArticleHierarchyMigrationStatement.executeAsync([
                    LEGAL_ARTICLE_HIERARCHY_MIGRATION,
                ]);
            } finally {
                await recordArticleHierarchyMigrationStatement.finalizeAsync();
            }
        }

        const articleAncestryMigrationStatement = await database.prepareAsync(
            'SELECT migration_id FROM legal_data_migrations WHERE migration_id = ?;'
        );

        let articleAncestryMigrationApplied: boolean;
        try {
            const result = await articleAncestryMigrationStatement.executeAsync<{ migration_id: string }>([
                LEGAL_ARTICLE_ANCESTRY_MIGRATION,
            ]);
            articleAncestryMigrationApplied = (await result.getFirstAsync()) !== null;
        } finally {
            await articleAncestryMigrationStatement.finalizeAsync();
        }

        if (!articleAncestryMigrationApplied) {
            const ambiguousArticlesStatement = await database.prepareAsync(`
                SELECT COUNT(*) AS count
                FROM legal_articles AS article
                JOIN legal_titles AS legal_title ON legal_title.id = article.legal_title_id
                WHERE article.chapter_id IS NULL
                    AND article.topic_id IS NULL
                    AND (
                        legal_title.has_chapters = 1
                        OR EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.legal_title_id = legal_title.id
                        )
                    );
            `);

            let ambiguousArticleCount: number;
            try {
                const result = await ambiguousArticlesStatement.executeAsync<{ count: number }>([]);
                ambiguousArticleCount = Number((await result.getFirstAsync())?.count ?? 0);
            } finally {
                await ambiguousArticlesStatement.finalizeAsync();
            }

            if (ambiguousArticleCount > 0) {
                throw new Error(
                    `Cannot migrate legal article ancestry: ${ambiguousArticleCount} article(s) belong to a title with chapters but have no chapter or topic parent. Assign their exact parent before retrying.`
                );
            }

            await database.execAsync(`
                DROP TRIGGER IF EXISTS legal_titles_topics_require_chapters_insert;
                DROP TRIGGER IF EXISTS legal_titles_topics_require_chapters_update;
                DROP TRIGGER IF EXISTS legal_chapters_validate_title_insert;
                DROP TRIGGER IF EXISTS legal_chapters_validate_title_update;
                DROP TRIGGER IF EXISTS legal_topics_validate_chapter_insert;
                DROP TRIGGER IF EXISTS legal_topics_validate_chapter_update;
                DROP TRIGGER IF EXISTS legal_titles_prevent_structure_flag_conflict;
                DROP TRIGGER IF EXISTS legal_articles_validate_parent_insert;
                DROP TRIGGER IF EXISTS legal_articles_validate_parent_update;

                ALTER TABLE legal_titles DROP COLUMN has_topics;
                ALTER TABLE legal_titles DROP COLUMN has_chapters;

                CREATE TRIGGER legal_articles_validate_parent_insert
                BEFORE INSERT ON legal_articles
                WHEN
                    (NEW.chapter_id IS NOT NULL AND NEW.topic_id IS NOT NULL)
                    OR (
                        NEW.chapter_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.id = NEW.chapter_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                                AND NOT EXISTS (
                                    SELECT 1
                                    FROM legal_topics AS topic
                                    WHERE topic.chapter_id = chapter.id
                                )
                        )
                    )
                    OR (
                        NEW.topic_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_topics AS topic
                            JOIN legal_chapters AS chapter ON chapter.id = topic.chapter_id
                            WHERE topic.id = NEW.topic_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                        )
                    )
                    OR (
                        NEW.chapter_id IS NULL
                        AND NEW.topic_id IS NULL
                        AND EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.legal_title_id = NEW.legal_title_id
                        )
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Article parent does not match its legal title hierarchy.');
                END;

                CREATE TRIGGER legal_articles_validate_parent_update
                BEFORE UPDATE OF legal_title_id, chapter_id, topic_id ON legal_articles
                WHEN
                    (NEW.chapter_id IS NOT NULL AND NEW.topic_id IS NOT NULL)
                    OR (
                        NEW.chapter_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.id = NEW.chapter_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                                AND NOT EXISTS (
                                    SELECT 1
                                    FROM legal_topics AS topic
                                    WHERE topic.chapter_id = chapter.id
                                )
                        )
                    )
                    OR (
                        NEW.topic_id IS NOT NULL
                        AND NOT EXISTS (
                            SELECT 1
                            FROM legal_topics AS topic
                            JOIN legal_chapters AS chapter ON chapter.id = topic.chapter_id
                            WHERE topic.id = NEW.topic_id
                                AND chapter.legal_title_id = NEW.legal_title_id
                        )
                    )
                    OR (
                        NEW.chapter_id IS NULL
                        AND NEW.topic_id IS NULL
                        AND EXISTS (
                            SELECT 1
                            FROM legal_chapters AS chapter
                            WHERE chapter.legal_title_id = NEW.legal_title_id
                        )
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Article parent does not match its legal title hierarchy.');
                END;
            `);

            const recordArticleAncestryMigrationStatement = await database.prepareAsync(
                'INSERT INTO legal_data_migrations (migration_id) VALUES (?);'
            );
            try {
                await recordArticleAncestryMigrationStatement.executeAsync([
                    LEGAL_ARTICLE_ANCESTRY_MIGRATION,
                ]);
            } finally {
                await recordArticleAncestryMigrationStatement.finalizeAsync();
            }
        }

        await database.execAsync('COMMIT;');
        transactionStarted = false;
    } catch (error) {
        if (transactionStarted) {
            try {
                await database.execAsync('ROLLBACK;');
            } catch {
                // Preserve the migration error if rollback also fails.
            }
        }
        throw error;
    }
}
