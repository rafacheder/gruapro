UPDATE auth.users
SET encrypted_password = crypt('123@mudar!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'homero@system.local';