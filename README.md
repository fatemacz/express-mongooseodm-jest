# Download the zip and rename the project

https://github.com/fatemacz/nodeJS-mongoDB-docker/archive/refs/heads/main.zip

- rename the project in package.json

```
{
    "name": your-project-name,
    "private": true,
    "version": "0.0.0",
    "type": "module",
    ...
}
```

# Install husky, eslint, lint-staged, and prettier and their dependencies

npm install --save-dev husky eslint prettier lint-staged eslint-config-prettier eslint-plugin-prettier eslint-plugin-react

# Run following command in your terminal to setup Husky

```
    npx husky init
```

- This will create a .husky folder, with a pre-commit file that runs on every commit we make. There will be an “npm test” code in the pre-commit file. Since we don’t have any test, let us replace it to run our lint-staged.

```
    npx lint-staged
```

# Run npm run prepare to set up the hooks in husky

```
    npm run prepare
```

# Create commit-msg file under .husky folder and add the line below to add a commit-msg hook to Husky:

```
    npx commitlint --edit "$1"
```

# Edit files and folders

- Update the .eslint.json file as follows:

```
{
    "env": {
        "node": true,
        "es6": true
    },
    "extends": ["eslint:recommended", "plugin:prettier/recommended"],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": ["react", "prettier"],
    "rules": {
        "react/react-in-jsx-scope": "off"
    }
}
```

- Delete the index.html and vite.config.js files.
- Remove the vite.config.js file from the .eslintignore file:
- Delete the public, backend and src folders.

# open a Terminal and run the following commands to remove vite and react:

```
npm uninstall --save react react-dom
npm uninstall --save-dev vite @types/react @types/react-dom @vitejs/plugin-react @vitejs/plugin-react-swc eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

# Edit the package.json file and remove the dev, build, and preview from scripts from it:

```
"scripts": {
    "lint": "eslint .",
    "prepare": "husky"
},
```

# Create a new src/ folder, and within it create followings:

- src/db/ (for the data layer),
- src/services/ (for the services layer), and
- src/routes/ (for the routes layer) folders.

Our first application is going to be a blog application. For such an application, we are going to need the API to be able to do the following:

- Get a list of posts
- Get a single post
- Create a new post
- Update an existing post
- Delete an existing post

# Creating database schemas using Mongoose

- Install the mongoose library:

```
npm install mongoose
```

# Setting up the test environment

- Install jest, mongodb-memory-server and cross-env as dev dependencies:

```
npm install --save-dev jest@29.7.0 mongodb-memory-server@9.1.1 cross-env
```

Jest is a test runner used to define and execute unit tests. The mongodb-memory-server library allows us to spin up a fresh instance of a MongoDB database, storing data only in memory, so that we can run our tests on a fresh database instance.

- Create a src/test/ folder to put the setup for our tests in.

- Create a src/test/globalSetup.js file where we will import MongoMemoryServer from the previously installed library

```
import { MongoMemoryServer } from 'mongodb-memory-server';
import process from 'process';

export default async function globalSetup() {
    const instance = await MongoMemoryServer.create({
        binary: {
            version: '6.0.4',
        },
    });
    globalThis.__MONGOINSTANCE = instance;
    process.env.DATABASE_URL = instance.getUri();
}
```

- Create a src/test/globalTeardown.js file to stop the MongoDB instance when our tests are finished and add the following code inside it:

```
export default async function globalTeardown() {
    await globalThis.__MONGOINSTANCE.stop();
}
```

- Create a src/test/setupFileAfterEnv.js file. Here, we will define a beforeAll function to initialize our database connection in Mongoose before all tests run and an afterAll function to disconnect from the database after all tests finish running:

```
import mongoose from 'mongoose';
import { beforeAll, afterAll } from '@jest/globals';

import { initDatabase } from '../db/init.js';

beforeAll(async () => {
    await initDatabase();
});

afterAll(async () => {
    await mongoose.disconnect();
});

```

- Create a new jest.config.json file in the root of our project where we will define the config for our tests. In the jest.config.json file, we first set the test environment to node:

```
{
    "testEnvironment": "node",
    "globalSetup": "<rootDir>/src/test/globalSetup.js",
    "globalTeardown": "<rootDir>/src/test/globalTeardown.js",
    "setupFilesAfterEnv": ["<rootDir>/src/test/setupFileAfterEnv.js"]
}

```

- Edit the package.json file and add a test script, which will run Jest:

```
"scripts": {
    "test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest",
    "lint": "eslint .",
    "prepare": "husky"
},
```

Note: At the time of writing, the JavaScript ecosystem is still in the process of moving to the ECMAScript module (ESM) standard. In this book, we already use this new standard. However, Jest does not support it yet by default, so we need to pass the --experimental-vm-modules option when running Jest.

- If we attempt running this script now, we will see that there are no tests found, but we can still see that Jest is set up and working properly:

```
npm test
```

# Writing our first service function: createPost

For our first service function, we are going to make a function to create a new post. We can then write tests for it by verifying that the create function creates a new post with the specified properties. Follow these steps:

- Create a new src/services/posts.js file.

```
import { Post } from '../db/models/post.js';

export async function createPost({ title, author, contents, tags }) {
    const post = new Post({ title, author, contents, tags });
    return await post.save();
}

async function listPosts(query = {}, { sortBy = 'createdAt', sortOrder = 'descending' } = {}) {
    return await Post.find(query).sort({ [sortBy]: sortOrder });
}

export async function listAllPosts(options) {
    return await listPosts({}, options);
}

export async function listPostsByAuthor(author, options) {
    return await listPosts({ author }, options);
}

export async function listPostsByTag(tags, options) {
    return await listPosts({ tags }, options);
}

export async function getPostById(postId) {
    return await Post.findById(postId);
}

export async function updatePost(postId, { title, author, contents, tags }) {
    return await Post.findOneAndUpdate(
        { _id: postId },
        { $set: { title, author, contents, tags } },
        { new: true }
    );
}

export async function deletePost(postId) {
    return await Post.deleteOne({ _id: postId });
}
```

# Defining test cases for the services

- Create a new src/**tests**/ folder, which will contain all test definitions.
  Note: Alternatively, test files can also be co-located with the related files that they are testing. However, here we use the **tests** directory to make it easier to distinguish tests from other files.

- Create a new src/**tests**/posts.test.js file for our tests related to posts. In this file, start by importing mongoose and the describe, expect, and test functions from @jest/globals:

```
import mongoose from 'mongoose';
import { describe, expect, test, beforeEach } from '@jest/globals';
import {
    createPost,
    listAllPosts,
    listPostsByAuthor,
    listPostsByTag,
    getPostById,
    updatePost,
    deletePost,
} from '../services/posts.js';
import { Post } from '../db/models/post.js';

describe('creating posts', () => {
    test('with all parameters should succeed', async () => {
        const post = {
            title: 'Hello Mongoose!',
            author: 'Aye Chan',
            contents: 'This post is stored in a MongoDB database using Mongoose.',
            tags: ['mongoose', 'mongodb'],
        };
        const createdPost = await createPost(post);
        expect(createdPost._id).toBeInstanceOf(mongoose.Types.ObjectId);
        const foundPost = await Post.findById(createdPost._id);
        expect(foundPost).toEqual(expect.objectContaining(post));
        expect(foundPost.createdAt).toBeInstanceOf(Date);
        expect(foundPost.updatedAt).toBeInstanceOf(Date);
    });

    test('without title should fail', async () => {
        const post = {
            author: 'Aye Chan',
            contents: 'Post with no title',
            tags: ['empty'],
        };
        try {
            await createPost(post);
        } catch (err) {
            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.message).toContain('`title` is required');
        }
    });

    test('with minimal parameters should succeed', async () => {
        const post = {
            title: 'Only a title',
        };
        const createdPost = await createPost(post);
        expect(createdPost._id).toBeInstanceOf(mongoose.Types.ObjectId);
    });
});

const samplePosts = [
    { title: 'Learning Redux', author: 'Aye Chan', tags: ['redux'] },
    { title: 'Learn React Hooks', author: 'Aye Chan', tags: ['react'] },
    {
        title: 'Full-Stack React Projects',
        author: 'Aye Chan',
        tags: ['react', 'nodejs'],
    },
    { title: 'Guide to TypeScript' },
];

let createdSamplePosts = [];

beforeEach(async () => {
    await Post.deleteMany({});
    createdSamplePosts = [];
    for (const post of samplePosts) {
        const createdPost = new Post(post);
        createdSamplePosts.push(await createdPost.save());
    }
});

describe('listing posts', () => {
    test('should return all posts', async () => {
        const posts = await listAllPosts();
        expect(posts.length).toEqual(createdSamplePosts.length);
    });

    test('should return posts sorted by creation date descending by default', async () => {
        const posts = await listAllPosts();
        const sortedSamplePosts = createdSamplePosts.sort((a, b) => b.createdAt - a.createdAt);
        expect(posts.map((post) => post.createdAt)).toEqual(
            sortedSamplePosts.map((post) => post.createdAt)
        );
    });

    test('should take into account provided sorting options', async () => {
        const posts = await listAllPosts({
            sortBy: 'updatedAt',
            sortOrder: 'ascending',
        });
        const sortedSamplePosts = createdSamplePosts.sort((a, b) => a.updatedAt - b.updatedAt);
        expect(posts.map((post) => post.updatedAt)).toEqual(
            sortedSamplePosts.map((post) => post.updatedAt)
        );
    });

    test('should be able to filter posts by author', async () => {
        const posts = await listPostsByAuthor('Aye Chan');
        expect(posts.length).toBe(3);
    });

    test('should be able to filter posts by tag', async () => {
        const posts = await listPostsByTag('nodejs');
        expect(posts.length).toBe(1);
    });
});

describe('getting a post', () => {
    test('should return the full post', async () => {
        const post = await getPostById(createdSamplePosts[0]._id);
        expect(post.toObject()).toEqual(createdSamplePosts[0].toObject());
    });

    test('should fail if the id does not exist', async () => {
        const post = await getPostById('000000000000000000000000');
        expect(post).toEqual(null);
    });
});

describe('updating posts', () => {
    test('should update the specified property', async () => {
        await updatePost(createdSamplePosts[0]._id, {
            author: 'Test Author',
        });
        const updatedPost = await Post.findById(createdSamplePosts[0]._id);
        expect(updatedPost.author).toEqual('Test Author');
    });

    test('should not update other properties', async () => {
        await updatePost(createdSamplePosts[0]._id, {
            author: 'Test Author',
        });
        const updatedPost = await Post.findById(createdSamplePosts[0]._id);
        expect(updatedPost.title).toEqual('Learning Redux');
    });

    test('should update the updatedAt timestamp', async () => {
        await updatePost(createdSamplePosts[0]._id, {
            author: 'Test Author',
        });
        const updatedPost = await Post.findById(createdSamplePosts[0]._id);
        expect(updatedPost.updatedAt.getTime()).toBeGreaterThan(
            createdSamplePosts[0].updatedAt.getTime()
        );
    });

    test('should fail if the id does not exist', async () => {
        const post = await updatePost('000000000000000000000000', {
            author: 'Test Author',
        });
        expect(post).toEqual(null);
    });
});

describe('deleting posts', () => {
    test('should remove the post from the database', async () => {
        const result = await deletePost(createdSamplePosts[0]._id);
        expect(result.deletedCount).toEqual(1);
        const deletedPost = await Post.findById(createdSamplePosts[0]._id);
        expect(deletedPost).toEqual(null);
    });

    test('should fail if the id does not exist', async () => {
        const result = await deletePost('000000000000000000000000');
        expect(result.deletedCount).toEqual(0);
    });
});
```

# Run the test

Using unit tests we can do isolated tests on our service functions without having to define and manually access routes or write some manual test setups. These tests also have the added advantage that when we change code later, we can ensure that the previously defined behavior did not change by re-running the tests.

```
npm test
```

- Output

```

> express-mongooseodm-jest@0.0.0 test
> cross-env NODE_OPTIONS=--experimental-vm-modules jest

(node:14412) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
  console.info
    successfully connected to database: mongodb://127.0.0.1:17975/

      at NativeConnection.info (src/db/init.js:8:17)

 PASS  src/__tests__/posts.test.js
  creating posts
    √ with all parameters should succeed (29 ms)
    √ without title should fail (8 ms)
    √ with minimal parameters should succeed (4 ms)
  listing posts
    √ should return all posts (5 ms)
    √ should return posts sorted by creation date descending by default (5 ms)
    √ should take into account provided sorting options (6 ms)
    √ should be able to filter posts by author (4 ms)
    √ should be able to filter posts by tag (6 ms)
  getting a post
    √ should return the full post (6 ms)
    √ should fail if the id does not exist (5 ms)
  updating posts
    √ should update the specified property (9 ms)
    √ should not update other properties (5 ms)
    √ should update the updatedAt timestamp (5 ms)
    √ should not update other properties (5 ms)
    √ should not update other properties (5 ms)
    √ should update the updatedAt timestamp (5 ms)
    √ should fail if the id does not exist (4 ms)
  deleting posts
    √ should remove the post from the database (5 ms)
    √ should fail if the id does not exist (4 ms)

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        0.642 s, estimated 1 s
Ran all test suites.
```

# Using the Jest VS Code extension

- Go to the Extensions tab in the VS Code sidebar.
- Enter Orta.vscode-jest in the search box to find the Jest extension.
- Install the extension by pressing the Install button.
- Now go to the newly added test icon on the sidebar (it should be a chemistry flask icon):

The Jest extension provides us an overview of all tests that we have defined. We can hover over them and press on the Play icon to re-run a specific test. By default, the Jest extension enables auto-run watch. If auto-run-watch is enabled, the extension will re-run tests automatically when test definition files are saved. That’s pretty handy!

# Providing a REST API using Express

Having our data and service layers set up, we have a good framework for being able to write our backend. However, we still need an interface that lets users access our backend. This interface will be a representational state transfer (REST) API. A REST API provides a way to access our server via HTTP requests, which we can make use of when we develop our frontend.

- GET: This is used to read resources. Generally, it should not influence the database state and, given the same input, it should return the same output (unless the database state was changed through other requests). This behavior is called idempotence. In response to a successful GET request, a server usually returns the resource(s) with a 200 OK status code.
- POST: This is used to create new resources, from the information provided in the request body. In response to a successful POST request, a server usually either returns the newly created object with a 201 Created status code or returns an empty response (with 201 Created status code) with a URL in the Location header that points to the newly created resource.
- PUT: This is used to update an existing resource with a given ID, replacing the resource completely with the new data provided in the request body. In some cases, it can also be used to create a new resource with a client-specified ID. In response to a successful PUT request, a server either returns the updated resource with a 200 OK status code, 204 No Content if it does not return the updated resource, or 201 Created if it created a new resource.
- PATCH: This is used to modify an existing resource with a given ID, only updating the fields specified in the request body instead of replacing the whole resource. In response to a successful PATCH request, a server either returns the updated resource with 200 OK or 204 No Content if it does not return the updated resource.
- DELETE: This is used to delete a resource with a given ID. In response to a successful DELETE request, a server either returns the deleted resource with 200 OK or 204 No Content if it does not return the deleted resource.

HTTP REST API routes are usually defined in a folder-like structure. It is always a good idea to prefix all routes with /api/v1/ (v1 being the version of the API definition, starting with 1). If we want to change the API definition later, we can then easily run /api/v1/ and /api/v2/ in parallel for a while until everything is migrated.

# Defining our API routes

Now that we have learned how HTTP REST APIs work, let’s start by defining routes for our backend, covering all functionality we have already implemented in the service functions:

- GET /api/v1/posts: Get a list of all posts
- GET /api/v1/posts?sortBy=updatedAt&sortOrder=ascending: Get a list of all posts sorted by updatedAt (ascending)
- GET /api/v1/posts?author=aye: Get a list of posts by author “aye”
- GET /api/v1/posts?tag=react: Get a list of posts with the tag react
- GET /api/v1/posts/:id: Get a single post by ID
- POST /api/v1/posts: Create a new post
- PATCH /api/v1/posts/:id: Update an existing post by ID
- DELETE /api/v1/posts/:id: Delete an existing post by ID

# Setting up Express

Express is a web application framework for Node.js. It provides utility functions to easily define routes for REST APIs and serve HTTP servers. Express is also very extensible, and there are many plugins for it in the JavaScript ecosystem.

- First, install the express dependency:

```
npm install express
```

- Create a new src/app.js file. This file will contain everything needed to set up our Express app.

```
import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

export { app };
```

# Using dotenv for setting environment variables

A good way to load environment variables is using dotenv, which loads environment variables from .env files into our process.env. This makes it easy to define environment variables for local development while keeping it possible to set them differently in, for example, a testing environment. Follow these steps to set up dotenv:

- Install the dotenv dependency:

```
npm install dotenv
```

- create a .env file in the root of the project and define the two environment variables there:

```
PORT=3000
DATABASE_URL=mongodb://localhost:27017/blog
```

- Edit .gitignore and add .env to exclude the .env file from the Git repository, as it is only used for local development.

- To make it easier for someone to get started with our project, create a copy of .env file and duplicate it to .env.template, making sure that it does not contain any sensitive credentials, of course! Sensitive credentials could instead be stored in, for example, a shared password manager.

- Next, create a new src/index.js file to create a server and specify a port.
  Import dotenv here, and call dotenv.config() to initialize the environment variables. We should do this before we call any other code in our app:

```
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { initDatabase } from './db/init.js';

try {
    await initDatabase();
    const PORT = process.env.PORT;
    app.listen(PORT);
    console.info(`express server running on http://localhost:${PORT}`);
} catch (err) {
    console.error('error connecting to database:', err);
}
```

- Edit package.json and add a start script to run our server

```
{
    ...
    "scripts": {
        "start": "node src/index.js",
        "test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest",
        "lint": "eslint .",
        "prepare": "husky"
    },
    ...
}
```

- Run the backend server by executing the following command:

```
npm start
```

# Using nodemon for easier development

To make our server auto-restart on changes, we can use the nodemon tool. The nodemon tool allows us to run our server, similarly to the node CLI command. However, it offers the possibility to auto-restart the server on changes to the source files.

- Install the nodemon tool as a dev dependency:

```
npm install --save-dev nodemon
```

- Create a new nodemon.json file in the root of your project and add the following contents to it:

```
{
    "watch": ["./src", ".env", "package-lock.json"]
}
```

This makes sure that all code in the src/ folder is watched for changes, and it will refresh if any files inside it are changed. Additionally, we specified the .env file in case environment variables are changed and the package-lock.json file in case packages are added or upgraded.

- Edit package.json and define a new "dev" script that runs nodemon:

```
{
    ...
    "scripts": {
        "dev": "nodemon src/index.js",
        "start": "node src/index.js",
        "test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest",
        "lint": "eslint .",
        "prepare": "husky"
    },
    ...
}
```

- Stop the server (if it is currently running) and start it again by running the following command:

```
npm run dev
```

- As we can see, our server is now running through nodemon! We can try it out by changing the port in the .env file while Keep the server running.

```
PORT=3001
```

- Output

```
> express-mongooseodm-jest@0.0.0 dev
> nodemon src/index.js

[nodemon] 3.1.9
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src\**\* .env package-lock.json
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node src/index.js`
successfully connected to database: mongodb://localhost:27017/blog
express server running on http://localhost:3000
[nodemon] restarting due to changes...
[nodemon] starting `node src/index.js`
successfully connected to database: mongodb://localhost:27017/blog
express server running on http://localhost:3001
```

After making the change, nodemon automatically restarted the server for us with the new port. We now have something like hot reloading, but for backend development—awesome! Now that we have improved the developer experience on the backend, let’s start writing our API routes with Express. Keep the server running (via nodemon) to see it restart and update live while coding!

# Creating our API routes with Express

- Create a new src/routes/posts.js file and import the service functions there:

```
import {
    listAllPosts,
    listPostsByAuthor,
    listPostsByTag,
    getPostById,
    createPost,
    updatePost,
    deletePost,
} from '../services/posts.js';

export function postsRoutes(app) {
    app.get('/api/v1/posts', async (req, res) => {
        const { sortBy, sortOrder, author, tag } = req.query;
        const options = { sortBy, sortOrder };
        try {
            if (author && tag) {
                return res.status(400).json({ error: 'query by either author or tag, not both' });
            } else if (author) {
                return res.json(await listPostsByAuthor(author, options));
            } else if (tag) {
                return res.json(await listPostsByTag(tag, options));
            } else {
                return res.json(await listAllPosts(options));
            }
        } catch (err) {
            console.error('error listing posts', err);
            return res.status(500).end();
        }
    });

    app.get('/api/v1/posts/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const post = await getPostById(id);
            if (post === null) return res.status(404).end();
            return res.json(post);
        } catch (err) {
            console.error('error getting post', err);
            return res.status(500).end();
        }
    });

    app.post('/api/v1/posts', async (req, res) => {
        try {
            const post = await createPost(req.body);
            return res.json(post);
        } catch (err) {
            console.error('error creating post', err);
            return res.status(500).end();
        }
    });

    app.patch('/api/v1/posts/:id', async (req, res) => {
        try {
            const post = await updatePost(req.params.id, req.body);
            return res.json(post);
        } catch (err) {
            console.error('error updating post', err);
            return res.status(500).end();
        }
    });

    app.delete('/api/v1/posts/:id', async (req, res) => {
        try {
            const { deletedCount } = await deletePost(req.params.id);
            if (deletedCount === 0) return res.sendStatus(404);
            return res.status(204).end();
        } catch (err) {
            console.error('error deleting post', err);
            return res.status(500).end();
        }
    });
}

```

- Edit src/app.js and import the postsRoutes function there:

```
import express from 'express';

import { postsRoutes } from './routes/posts.js';

const app = express();
// app.use(cors());
// app.use(bodyParser.json());

postsRoutes(app);

app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

export { app };
```

- Go to http://localhost:3001/api/v1/posts to see the route in action!

# Defining routes with a JSON request body

To define routes with a JSON request body in Express, we need to use the body-parser module. This module detects if a client sent a JSON request (by looking at the Content-Type header) and then automatically parses it for us so that we can access the object in req.body.

- Install the body-parser dependency:

```
npm install body-parser@1.20.2
```

- Edit src/app.js and import the body-parser there:

```
import express from 'express';
import bodyParser from 'body-parser';

import { postsRoutes } from './routes/posts.js';

const app = express();
app.use(bodyParser.json());

postsRoutes(app);

app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

export { app };
```

As we can see, Express makes defining and handling routes, requests, and responses much easier. It already detects and sets headers for us, and thus it can read and send JSON responses properly. It also allows us to change the HTTP status code easily.

# Allowing access from other URLs using CORS

Browsers have a safety feature to only allow us to access APIs on the same URL as the page we are currently on. To allow access to our backend from other URLs than the backend URL itself (for example, when we run the frontend on a different port), we need to allow CORS requests. Let’s set that up now by using the cors library with Express:

- Install the cors dependency

```
npm install cors
```

- Edit src/app.js and import cors there

```
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { postsRoutes } from './routes/posts.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

postsRoutes(app);

app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

export { app };
```

# Trying out the routes

After defining our routes, we can try them out by using the fetch() function in the browser:

- In your browser, go to http://localhost:3001/, open the console by Ctrl+Shift+J or right-clicking on a page and clicking Inspect, then go to the Console tab.
- In the console, enter the following code to make a GET request to get all posts:

```
fetch('http://localhost:3001/api/v1/posts')
.then(res => res.json())
.then(console.log)
```

Output

```
[
    {
        "_id": "67eca47667cf87e403d9b532",
        "title": "Hello again, Mongoose!",
        "author": "Aye Chan",
        "contents": "This post is stored in a MongoDB database using Mongoose.",
        "tags": [
            "mongoose",
            "mongodb"
        ],
        "createdAt": "2025-04-02T02:44:06.578Z",
        "updatedAt": "2025-04-02T02:44:06.611Z",
        "__v": 0
    }
]
```

- Now we can modify this code to make a POST request by specifying the Content-Type header to tell the server that we will be sending JSON and then sending a body with JSON. stringify (as the body has to be a string):

```
fetch('http://localhost:3001/api/v1/posts', {
headers: { 'Content-Type': 'application/json' },
method: 'POST',
body: JSON.stringify({ title: 'Test Post' })
})
.then(res => res.json())
.then(console.log)
```

Output

```
{
    "title": "Test Post",
    "tags": [],
    "_id": "67ecfe60b5a740039969030c",
    "createdAt": "2025-04-02T09:07:44.565Z",
    "updatedAt": "2025-04-02T09:07:44.565Z",
    "__v": 0
}
```

- Similarly, we can also send a PATCH request, as follows (Make sure to replace the MongoDB IDs in the URL with the one returned from the POST request made before!):

```
fetch('http://localhost:3001/api/v1/posts/67ecfe60b5a740039969030c', {
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
    body: JSON.stringify({ title: 'Test Post Changed' })
})
.then(res => res.json())
.then(console.log)
```

Output

```
{
    "_id": "67ecfe60b5a740039969030c",
    "title": "Test Post Changed",
    "tags": [],
    "createdAt": "2025-04-02T09:07:44.565Z",
    "updatedAt": "2025-04-02T09:11:05.510Z",
    "__v": 0
}
```

- Finally, we can send a DELETE request (Make sure to replace the MongoDB IDs in the URL with the one returned from the POST request made before!):

```
fetch('http://localhost:3001/api/v1/posts/67ecfe60b5a740039969030c', {
method: 'DELETE',
})
.then(res => res.status)
.then(console.log)
```

Output

```
204
```

- When doing a GET request, we can see that our post has now been deleted again (Make sure to replace the MongoDB IDs in the URL with the one returned from the POST request made before!):

```
fetch('http://localhost:3001/api/v1/posts/67ecfe60b5a740039969030c')
.then(res => res.status)
.then(console.log)
```

Output

```
GET http://localhost:3001/api/v1/posts/67ecfe60b5a740039969030c net::ERR_ABORTED 404 (Not Found)
404
```
