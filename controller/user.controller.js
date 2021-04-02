const uuid = require('uuid');
const ApiError = require('../error/ApiError');
let users = require('../data/users');

class UserController {
    createUser(req, res) {
        const createNewUser = ({ login, password, age }) => ({
            id: uuid.v4(),
            login,
            password,
            age,
            isDeleted: false
        });
        const newUser = createNewUser(req.body);

        const isLoginExists = users.filter(user => !user.isDeleted && user.login === newUser.login);
        if (isLoginExists.length) {
            return res.json({ message: 'login should be unique' });
        }


        users.push(newUser);

        res.json(newUser);
    }

    getUsers(req, res) {
        const { limit, sort, loginSubstring } = req.query;

        const getAutoSuggestUsers = () => {
            const num = sort === 'desc' ? 1 : -1;

            const filteredUsersList = users.filter(user => loginSubstring ? user.login.includes(loginSubstring) : true);

            const sortedUsersList = filteredUsersList.sort((a, b) => {
                const loginA = a.login.toLowerCase();
                const loginB = b.login.toLowerCase();
                if (loginA < loginB) return num;
                if (loginA > loginB) return -num;
                return 0;
            });

            const newUsersList = limit ? sortedUsersList.slice(0, limit) : sortedUsersList;

            const usersListForResponse = newUsersList
                .filter(user => !user.isDeleted)
                .map(user => {
                    // eslint-disable-next-line no-unused-vars
                    const { password, isDeleted, ...rest } = user;
                    return rest;
                });

            return { users: usersListForResponse, count: usersListForResponse.length };
        };

        res.json(getAutoSuggestUsers(loginSubstring, limit));
    }

    getUserById(req, res) {
        const id = req.params.id;
        const currentUser = users.filter(user => user.id === id);
        res.json(currentUser);
    }

    updateUser(req, res) {
        const id = req.params.id;
        const currentUser = users.filter(user => user.id === id);
        users = users.filter(user => user.id !== id);

        const updatedUser = {
            ...currentUser[0],
            ...req.body
        };
        users.push(updatedUser);
        res.json(updatedUser);
    }

    deleteUser(req, res) {
        const id = req.params.id;
        const currentUser = users.filter(user => user.id === id);

        if (currentUser.length && currentUser[0].isDeleted || !currentUser.length) {
            return res.status(400).json(ApiError.badRequest('user not found'));
        }
        users = users.map(user => {
            if (user.id === id) {
                user.isDeleted = true;
            }
            return user;
        });

        res.json({ message: 'successfully deleted' });
    }
}

module.exports = new UserController();
