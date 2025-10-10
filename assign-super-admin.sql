-- Assign super_admin role to user tungle
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT 
    '89499b3d-8109-4c12-b565-34e9b1693914'::uuid as user_id,
    r.role_id,
    NOW() as assigned_at,
    true as is_active
FROM roles r 
WHERE r.name = 'super_admin'
ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();

-- Verify the assignment
SELECT 
    u.username,
    r.name as role_name,
    r.display_name,
    ur.is_active,
    ur.assigned_at
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE u.user_id = '89499b3d-8109-4c12-b565-34e9b1693914';
