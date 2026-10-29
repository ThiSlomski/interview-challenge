exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE imobilead.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(150) NOT NULL,
      email text COLLATE "C" NOT NULL UNIQUE,
      password_hash text NOT NULL,
      address text,
      city text,
      state text,
      country text,
      postal_code text,
      message text,
      role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT users_email_canonical CHECK (email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'),
      CONSTRAINT users_password_hash_nonempty CHECK (length(password_hash) > 0),
      CONSTRAINT users_dates CHECK (updated_at >= created_at)
    );
    CREATE TABLE imobilead.sessions (
      token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32),
      user_id uuid NOT NULL REFERENCES imobilead.users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL CHECK (expires_at > created_at),
      revoked_at timestamptz CHECK (revoked_at >= created_at)
    );
    CREATE INDEX sessions_user_id_idx ON imobilead.sessions(user_id);
  `);
};

// Deliberately forward-only: no down/reset command on the existing database.
exports.down = () => { throw new Error('Destructive rollback requires a separately reviewed migration.'); };
