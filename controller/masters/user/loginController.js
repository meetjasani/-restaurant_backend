import Joi from "joi";
import { User, RefreshToken, Role, Functionality, License } from '../../../models';
import { CustomeErrorHandler, JwtService } from "../../../services";
import bcrypt from 'bcrypt';
import { REFRESH_SECRET, REFRESH_TOKEN_EXPIRY } from "../../../config";

const loginController = {
    async login(req, res, next) {
        // Validation
        const loginSchema = Joi.object({
            loginId: Joi.string().required(),
            // mobileNumber: Joi.string().regex(/^[0-9]{10}$/).messages({ 'string.pattern.base': `Mobile number must have 10 digits.` }).required(),
            password: Joi.string().required(),
        });

        const { error } = loginSchema.validate(req.body);
        if (error) {
            return next(error);
        }

        const { loginId, password } = req.body;

        try {

            const user = await User.findOne({ $or: [{ mobileNumber: loginId }, { username: loginId }], isEnabled: true, isDelete: false })
                // .populate('roleId', 'name description rights', Role)
                // .populate('rights.functionalityId', '_id name', Functionality)
                .populate({ path: 'roleId', populate: [{ path: 'rights.functionalityId', model: 'Functionality', select: '-_id name' }], model: 'Role' });
            if (!user) {
                return next(CustomeErrorHandler.wrongCredentials('Wrong Credentials.....'));
            }

            const passMatch = await bcrypt.compare(password, user.password);
            if (!passMatch) {
                return next(CustomeErrorHandler.wrongCredentials('Wrong Credentials.....'));
            }

            // console.log(user);
            const userId = user._id;
            const userName = user.name;
            const role = user.roleId !== undefined ? user.roleId['name'] : "";
            const roleId = user.roleId !== undefined ? user.roleId['_id'] : "";
            let rights = [];
            if (user.roleId !== undefined) {
                user.roleId.rights.map((result) => {
                    // rights['name'] = result.functionalityId.name
                    const res = JSON.parse(JSON.stringify(result))
                    res['name'] = result['functionalityId'].name
                    delete res['functionalityId']
                    delete res['_id']
                    rights.push(res)
                });
            }
            const isLicenseUser = user.roleId === undefined;
            let licenseDetails = {};
            if (user.licenseId) {
                licenseDetails = await License.findById({ _id: user.licenseId }).select('_id name gstNo address contactNo logo')
            }
            const access_token = JwtService.sign({ _id: user._id, name: user.name, role: roleId, licenseId: licenseDetails._id });
            // const refresh_token = JwtService.sign({ _id: user._id, name: user.name, role: roleId, licenseId: licenseDetails._id }, REFRESH_SECRET, REFRESH_TOKEN_EXPIRY);

            //Database White List
            // await RefreshToken.create({ token: refresh_token });

            //Socket to send message to client
            globalEmit("logout", { user_id: userId });
            res.json({ userId, userName, role, rights, isLicenseUser, access_token, licenseDetails });

        } catch (err) {
            console.log(err);
            return next(err);
        }
    },

    async logout(req, res, next) {
        // token validation
        const refreshSchema = Joi.object({
            refresh_token: Joi.string().required(),
        });

        const { error } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            await RefreshToken.deleteOne({ token: req.body.refresh_token });
        } catch (err) {
            return next(new Error('Something went Wrong in DB...'));

        }

        res.json({ status: 1 });
    }
};

export default loginController;