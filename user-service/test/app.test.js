import assert from 'assert';
import app from '../server.js';
import request from 'supertest';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';

describe('User Service Test', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests

    describe('Test healthz', function () {
        after(async () => await clearMockDb()) // Clear the mock database after all tests in this block
        it('Respond with 200 status code with success message', async function () {
            const res = await request(app)
                .get('/healthz')
                .expect(200)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Connected to /healthz route of user-service', 'Response message does not match');
        });
    });

    describe('Test registration', function() {
        after(async () => await clearMockDb()) // Clear the mock database after all tests in this block

        it('Respond with 400 status code when email is missing', async function () {
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    displayName: 'test1',
                    password: 'abcde123'
                })
                .expect(400)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Email, password and displayName are required', 'Response message does not match');
        });

        it('Respond with 400 status code when password is missing', async function () {
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test1@email.com',
                    displayName: 'test1'
                })
                .expect(400)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Email, password and displayName are required', 'Response message does not match');
        });

        it('Respond with 400 status code when displayName is missing', async function () {
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test1@email.com',
                    password: 'abcde123'
                })
                .expect(400)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Email, password and displayName are required', 'Response message does not match');
        });

        it('Respond with 400 status code when password is weak with less than 8 characters', async function () {
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test1@email.com',
                    displayName: 'test1',
                    password: 'abc123'
                })
                .expect(400)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers', 'Response message does not match');
        });

        it('Respond with 400 status code when password is weak with only alphabets', async function () {
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test1@email.com',
                    displayName: 'test1',
                    password: 'abcdefghijkl'
                })
                .expect(400)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers', 'Response message does not match');
        });

        it('Respond with 400 status code when password is weak with only numbers', async function () {
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test1@email.com',
                    displayName: 'test1',
                    password: '123123123123'
                })
                .expect(400)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers', 'Response message does not match');
        });

        it('Respond with 409 status code when email already exists', async function () {
            // Create a user first
            await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test1@email.com',
                    displayName: 'test1',
                    password: 'abcde123'
                })
                .expect(201);

            // Try to create the same user again
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test1@email.com',
                    displayName: 'test1',
                    password: 'abcde123'
                })
                .expect(409)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Email already exists', 'Response message does not match');
        });

        it('Respond with 201 status code with success message', async function () {
            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test2@email.com',
                    displayName: 'test2',
                    password: 'abcde123'
                })
                .expect(201)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'New user created successfully', 'Response message does not match');
        });

        it('Respond with 500 status code when there is an unknown server error', async function () {
            
            // Simulate server error by mocking ormCreateUser to throw an error

            const res = await request(app)
                .post('/api/user-service/users/')
                .send({
                    email: 'test3@email.com',
                    displayName: 'test3',
                    password: 'abcde123'
                })
                .expect(500)
                .expect('Content-Type', /json/);
            assert.equal(res.body.message, 'Unknown server error', 'Response message does not match');
        });
    });


});





