-- Enable Supabase Realtime for the key tables in Approva DB

-- 1. Check if the supabase_realtime publication exists, otherwise create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add the tables to the publication
-- Note: In PostgreSQL, we can use ALTER PUBLICATION to add tables.
-- If the table is already in the publication, pg will gracefully handle it or we can run add/drop commands.
-- Below is the standard safe way to enable realtime replication for individual tables.

ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE general_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE assets;
ALTER PUBLICATION supabase_realtime ADD TABLE project_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
