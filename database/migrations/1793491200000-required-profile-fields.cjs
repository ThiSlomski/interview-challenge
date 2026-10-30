exports.up = pgm => {
  // ECMAScript String.trim whitespace, including tabs, NBSP and BOM. Do not
  // manufacture or rewrite legacy values: incompatible rows block the upgrade.
  const whitespace = [9, 10, 11, 12, 13, 32, 160, 5760, 8192, 8193, 8194, 8195,
    8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288, 65279]
    .map(code => `chr(${code})`).join(' || ');
  const fields = ['name', 'city', 'state', 'country'];
  pgm.sql(`
    LOCK TABLE imobilead.users IN ACCESS EXCLUSIVE MODE;
    DO $essential_fields$
    BEGIN
      IF EXISTS (SELECT 1 FROM imobilead.users WHERE
        ${fields.map(field => `${field} IS NULL OR length(btrim(${field}, ${whitespace})) = 0`).join(' OR ')}) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'ESSENTIAL_PROFILE_FIELDS_INCOMPATIBLE';
      END IF;
    END
    $essential_fields$;
    ALTER TABLE imobilead.users
      ALTER COLUMN city SET NOT NULL,
      ALTER COLUMN state SET NOT NULL,
      ALTER COLUMN country SET NOT NULL,
      ${fields.map(field => `ADD CONSTRAINT users_${field}_nonblank CHECK (length(btrim(${field}, ${whitespace})) > 0)`).join(',\n      ')};
  `);
};

exports.down = () => { throw new Error('Destructive rollback requires a separately reviewed migration.'); };
