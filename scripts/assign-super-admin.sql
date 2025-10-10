-- Assign super_admin role to user by username
-- Usage: Replace 'tungle' with the actual username
-- scp -i "mmo-portfolio-key.pem" ./scripts/assign-super-admin.sql ec2-user@ec2-34-228-198-131.compute-1.amazonaws.com:/home/ec2-user/mmotion-portfolio/scripts/
-- ssh -i "mmo-portfolio-key.pem" ec2-user@ec2-34-228-198-131.compute-1.amazonaws.com "docker exec -i portfolio-postgres psql -U postgres -d portfolio_db < /home/ec2-user/mmotion-portfolio/scripts/assign-super-admin.sql"

INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT 
    u.user_id,
    r.role_id,
    NOW() as assigned_at,
    true as is_active
FROM users u, roles r 
WHERE u.username = 'tungle'  -- Replace with actual username
  AND r.name = 'super_admin'
ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();

-- Verify the assignment
SELECT 
    u.username,
    u.email,
    r.name as role_name,
    r.display_name,
    ur.is_active,
    ur.assigned_at
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE u.username = 'tungle';  -- Replace with actual username
