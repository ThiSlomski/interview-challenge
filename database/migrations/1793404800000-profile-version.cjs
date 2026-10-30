exports.up = pgm => {
  pgm.sql(`ALTER TABLE imobilead.users ADD COLUMN profile_version integer NOT NULL DEFAULT 1
    CONSTRAINT users_profile_version_positive CHECK (profile_version > 0)`);
};

exports.down = () => { throw new Error('Destructive rollback requires a separately reviewed migration.'); };
