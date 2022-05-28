import { ObjectId } from "mongodb";
import { License, User } from "../../../models";

const getUsers = {
    async getAll(req, res, next) {
        let result;
        try {
            result = await User.find({ isDelete: false, roleId: { $exists: true }, licenseId: req.user.licenseId })
                .select('-licenseId -password -userId -isDelete -createdAt -updatedAt -__v')
                .sort({ name: -1 });
        } catch (error) {
            console.log(error);
            return next(error);
        }
        return res.json(result);
    },

    async hasUserRoleId(req, roleId) {
        return await User.exists({ roleId: roleId, licenseId: req.user.licenseId });
    },

    async userNameAvailable(req, res, next) {
        const name = req.params.name;
        const result = await User.exists({ username: name });
        return res.json(result ? false : true);
    },

    async getUser(req, res, next) {
        const _id = req.user._id;

        const user = await User.findById({ _id })
            // .populate('roleId', 'name description rights', Role)
            .populate('licenseId', 'name gstNo address contactNo logo', License)
            .populate({ path: 'roleId', populate: [{ path: 'rights.functionalityId', model: 'Functionality', select: '-_id name' }], select: '-licenseId -userId -isEnabled -isDelete -createdAt -updatedAt -__v', model: 'Role' })
            .select(' -userId  -password -isDelete -isEnabled -createdAt -updatedAt -__v').lean();

        // user['isLicenseUser'] = true;
        user['isLicenseUser'] = (user.roleId === undefined ? true : false);

        res.json(user);
    },

    async getUserList(req, res, next) {
        const user = await User.aggregate([
            {
                '$match': {
                    'licenseId': new ObjectId(req.user.licenseId),
                    'isEnabled': true,
                    'isDelete': false
                }
            }, {
                '$project': {
                    '_id': 0,
                    'value': '$_id',
                    'label': '$name'
                }
            }
        ])
        res.json(user);
    }
}
export default getUsers;