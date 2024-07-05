-- Insert test data into the app table
INSERT INTO app (id, name, status) VALUES
('123e4567-e89b-12d3-a456-426655440000', 'Test App', 'active'),
('223e4567-e89b-12d3-a456-426655440001', 'Another App', 'active');

-- Insert test data into the user_app table
INSERT INTO user_app (app_id, user_id, user_role) VALUES
('123e4567-e89b-12d3-a456-426655440000', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', 'owner'),
('223e4567-e89b-12d3-a456-426655440001', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', 'owner');

-- Insert test data into the resource table
INSERT INTO resource (id, app_id, resource_name, repo_name, status, module, vars) VALUES
('323e4567-e89b-12d3-a456-426655440002', '123e4567-e89b-12d3-a456-426655440000', 'Resource 1', 'repo-1', 'active', 'api', '{"apiUrl": "https://api.example.com"}'),
('423e4567-e89b-12d3-a456-426655440003', '123e4567-e89b-12d3-a456-426655440000', 'Resource 2', 'repo-2', 'active', 'frontend', '{"frontendUrl": "https://frontend.example.com"}');