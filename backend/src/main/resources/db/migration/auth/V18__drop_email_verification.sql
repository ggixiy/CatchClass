-- Підтвердження email при реєстрації прибрано: пошта потрібна лише для скидання пароля.
DELETE FROM auth.action_tokens WHERE type = 'EMAIL_VERIFICATION';
ALTER TABLE auth.credentials DROP COLUMN email_verified;
