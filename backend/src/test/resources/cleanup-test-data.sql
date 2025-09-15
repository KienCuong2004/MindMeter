-- Cleanup test data to avoid foreign key constraints
DELETE FROM advice_messages WHERE sender_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example%');
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example%';
