-- ============================================================
-- Script : Créer un utilisateur avec abonnement sur le plan 1
-- Mot de passe par défaut : password
-- ============================================================

SET @user_name = 'mohamed';

SET @user_email = 'mohamed@rxpress.com';
-- Bcrypt hash de "password" (généré par Laravel)
SET
    @user_password = '$2y$10$ZjT9jWxqiQ4dvR83iCfuTu6Y1FeMDR0mM0wq96wwSjNaiPPUnloWW';

SET @plan_id = 1;

-- 1. Créer l'utilisateur
INSERT INTO
    users (
        name,
        email,
        password,
        created_at,
        updated_at
    )
VALUES (
        @user_name,
        @user_email,
        @user_password,
        NOW(),
        NOW()
    );

SET @user_id = LAST_INSERT_ID();

-- 2. Créer l'abonnement sur le plan 1
INSERT INTO
    subscriptions (
        user_id,
        plan_id,
        start_date,
        renewal_date,
        status,
        created_at,
        updated_at
    )
VALUES (
        @user_id,
        @plan_id,
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
        'active',
        NOW(),
        NOW()
    );

SET @subscription_id = LAST_INSERT_ID();

-- 3. Créer les usage options à 0 pour chaque limite du plan 1
INSERT INTO
    sub_usage_options (
        subscription_id,
        plan_usage_option_limit_id,
        used,
        created_at,
        updated_at
    )
SELECT @subscription_id, id, 0, NOW(), NOW()
FROM plan_usage_option_limits
WHERE
    plan_id = @plan_id;

-- Vérification
SELECT 'Utilisateur créé :' AS info, id, name, email
FROM users
WHERE
    id = @user_id;

SELECT
    'Abonnement créé :' AS info,
    id,
    plan_id,
    start_date,
    renewal_date,
    status
FROM subscriptions
WHERE
    id = @subscription_id;

SELECT 'Usage options créées :' AS info, s.id, p.limit_name, p.value, p.unit, s.used
FROM
    sub_usage_options s
    JOIN plan_usage_option_limits p ON p.id = s.plan_usage_option_limit_id
WHERE
    s.subscription_id = @subscription_id;