/* Policy for project table*/
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_select"
ON projects
FOR SELECT
USING (
    owner_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = projects.id
          AND pc.user_id = auth.uid()
    )
);

CREATE POLICY "project_insert"
ON projects
FOR INSERT
WITH CHECK (
    owner_id = auth.uid()
);

CREATE POLICY "project_update"
ON projects
FOR UPDATE
USING (
    owner_id = auth.uid()
)
WITH CHECK (
    owner_id = auth.uid()
);

CREATE POLICY "project_delete"
ON projects
FOR DELETE
USING (
    owner_id = auth.uid()
);

/* policies for he assets table*/
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_select"
ON assets
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = assets.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = assets.project_id
          AND pc.user_id = auth.uid()
    )
);

CREATE POLICY "asset_insert"
ON assets
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = assets.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = assets.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);

CREATE POLICY "asset_update"
ON assets
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = assets.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = assets.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = assets.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = assets.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);

CREATE POLICY "asset_delete"
ON assets
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = assets.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = assets.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);

/* For the annotation table*/

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "annotation_select"
ON annotations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = annotations.asset_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN project_collaborators pc
            ON pc.project_id = a.project_id
        WHERE a.id = annotations.asset_id
          AND pc.user_id = auth.uid()
    )
);

CREATE POLICY "annotation_insert"
ON annotations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = annotations.asset_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN project_collaborators pc
            ON pc.project_id = a.project_id
        WHERE a.id = annotations.asset_id
          AND pc.user_id = auth.uid()
          AND pc.role IN ('admin', 'reviewer')
    )
);

CREATE POLICY "annotation_update"
ON annotations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = annotations.asset_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN project_collaborators pc
            ON pc.project_id = a.project_id
        WHERE a.id = annotations.asset_id
          AND pc.user_id = auth.uid()
          AND pc.role IN ('admin', 'reviewer')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = annotations.asset_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN project_collaborators pc
            ON pc.project_id = a.project_id
        WHERE a.id = annotations.asset_id
          AND pc.user_id = auth.uid()
          AND pc.role IN ('admin', 'reviewer')
    )
);

CREATE POLICY "annotation_delete"
ON annotations
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = annotations.asset_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN project_collaborators pc
            ON pc.project_id = a.project_id
        WHERE a.id = annotations.asset_id
          AND pc.user_id = auth.uid()
          AND pc.role IN ('admin', 'reviewer')
    )
);

CREATE POLICY "annotation_insert_user_check"
ON annotations
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

/*For annotation specific comments*/

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_select"
ON comments
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM annotations an
        JOIN assets a ON a.id = an.asset_id
        JOIN projects p ON p.id = a.project_id
        WHERE an.id = comments.annotation_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM annotations an
        JOIN assets a ON a.id = an.asset_id
        JOIN project_collaborators pc
            ON pc.project_id = a.project_id
        WHERE an.id = comments.annotation_id
          AND pc.user_id = auth.uid()
    )
);

CREATE POLICY "comment_insert"
ON comments
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND (
        EXISTS (
            SELECT 1
            FROM annotations an
            JOIN assets a ON a.id = an.asset_id
            JOIN projects p ON p.id = a.project_id
            WHERE an.id = comments.annotation_id
              AND p.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1
            FROM annotations an
            JOIN assets a ON a.id = an.asset_id
            JOIN project_collaborators pc
                ON pc.project_id = a.project_id
            WHERE an.id = comments.annotation_id
              AND pc.user_id = auth.uid()
              AND pc.role IN ('admin', 'reviewer')
        )
        OR
        EXISTS (
            SELECT 1
            FROM annotations an
            WHERE an.id = comments.annotation_id
              AND an.user_id = auth.uid()
        )
    )
);

CREATE POLICY "comment_update"
ON comments
FOR UPDATE
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "comment_delete"
ON comments
FOR DELETE
USING (
    user_id = auth.uid()
);

/* for general comment*/
ALTER TABLE general_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "general_comment_select"
ON general_comments
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = general_comments.asset_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM assets a
        JOIN project_collaborators pc
            ON pc.project_id = a.project_id
        WHERE a.id = general_comments.asset_id
          AND pc.user_id = auth.uid()
    )
);


CREATE POLICY "general_comment_insert"
ON general_comments
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND (
        EXISTS (
            SELECT 1
            FROM assets a
            JOIN projects p ON p.id = a.project_id
            WHERE a.id = general_comments.asset_id
              AND p.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1
            FROM assets a
            JOIN project_collaborators pc
                ON pc.project_id = a.project_id
            WHERE a.id = general_comments.asset_id
              AND pc.user_id = auth.uid()
        )
    )
);
CREATE POLICY "general_comment_update"
ON general_comments
FOR UPDATE
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);
CREATE POLICY "general_comment_delete"
ON general_comments
FOR DELETE
USING (
    user_id = auth.uid()
);

/* for collabortors table */
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_collaborators_select"
ON project_collaborators
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_collaborators.project_id
          AND pc.user_id = auth.uid()
    )
);

CREATE POLICY "project_collaborators_insert"
ON project_collaborators
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_collaborators.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);
CREATE POLICY "project_collaborators_update"
ON project_collaborators
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_collaborators.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_collaborators.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);

CREATE POLICY "project_collaborators_delete"
ON project_collaborators
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_collaborators.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);

/* for invite table*/

ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_invites_select"
ON project_invites
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_invites.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_invites.project_id
          AND pc.user_id = auth.uid()
    )
);
CREATE POLICY "project_invites_insert"
ON project_invites
FOR INSERT
WITH CHECK (
    invited_by = auth.uid()
    AND (
        EXISTS (
            SELECT 1
            FROM projects p
            WHERE p.id = project_invites.project_id
              AND p.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1
            FROM project_collaborators pc
            WHERE pc.project_id = project_invites.project_id
              AND pc.user_id = auth.uid()
              AND pc.role = 'admin'
        )
    )
);
CREATE POLICY "project_invites_update"
ON project_invites
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_invites.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_invites.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_invites.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_invites.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);
CREATE POLICY "project_invites_delete"
ON project_invites
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_invites.project_id
          AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1
        FROM project_collaborators pc
        WHERE pc.project_id = project_invites.project_id
          AND pc.user_id = auth.uid()
          AND pc.role = 'admin'
    )
);