import Joi from "joi";
import { EmailSetting } from '../../models'
import { CustomeErrorHandler } from "../../services";
import nodemailer from 'nodemailer'

const emailSettingController = {
    async add(req, res, next) {
        //Validating Req Data
        const emailSettingSchema = Joi.object({
            serverName: Joi.string().required(),
            userName: Joi.string().email().required().messages({ 'string.email': `Please enter a valid email address for username` }),
            password: Joi.string().required(),
            port: Joi.string().regex(/^[0-9]{4}$/).optional().allow('').messages({ 'string.pattern.base': `Invalid Port` }),
            enableSSL: Joi.boolean().required(),
            fromEmail: Joi.string().email().required().messages({ 'string.email': `Please enter a valid email address for from email` }),
            isDefault: Joi.boolean().required(),
        })

        const { error } = emailSettingSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return next(error);
        }

        let { serverName, userName, password, port, enableSSL, fromEmail, isDefault } = req.body;

        const emailSetting = new EmailSetting({
            serverName, userName, password, port, enableSSL, fromEmail, isDefault, userId: req.user._id, licenseId: req.user.licenseId
        });

        // Check For Duplicate Record
        try {
            const exist = await EmailSetting.exists({
                serverName, userName, password, port, enableSSL, fromEmail, isDelete: false, licenseId: req.user.licenseId
            }).collation({ locale: 'en', strength: 2 });

            if (exist) {
                return next(CustomeErrorHandler.alreadyExist());
            }
        } catch (error) {
            return next(error);
        }

        // //Sending Verification mail
        // // create reusable transporter object using the default SMTP transport
        // let transporter = nodemailer.createTransport({
        //     host: serverName,
        //     port: port,
        //     secure: enableSSL, // true for 465, false for other ports
        //     auth: {
        //         user: userName, // generated ethereal user
        //         pass: password, // generated ethereal password
        //     },
        // });

        // // Message object
        // let message = {
        //     from: fromEmail, // sender address
        //     to: fromEmail, // list of receivers
        //     subject: "Email Verification mail", // Subject line
        //     text: "If mail received in your mail box, verification done successfully", // plain text body
        //     html: "<b>If mail received in your mail box, verification done successfully</b>", // html body
        // };

        // // send mail with defined transport object
        // let info = transporter.sendMail(message, (err, info) => {
        //     if (err) {
        //         console.log('Error occurred. ' + err.message);
        //         return process.exit(1);
        //     }

        //     console.log('Message sent: %s', info.messageId);
        //     // Preview only available when sending through an Ethereal account
        //     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        // });

        // console.log(info);

        //Insert New Record
        let result;
        try {
            //console.log('New Data');
            result = await emailSetting.save();
        } catch (err) {
            return next(err);
        }

        return res.json(result);
    },

    async update(req, res, next) {
        //Validating Req Data
        const emailSettingSchema = Joi.object({
            _id: Joi.string().required(),
            serverName: Joi.string().required(),
            userName: Joi.string().email().required(),
            password: Joi.string().required(),
            port: Joi.string().regex(/^[0-9]{4}$/).optional().allow('').messages({ 'string.pattern.base': `Invalid Port` }),
            enableSSL: Joi.boolean().required(),
            fromEmail: Joi.string().email().required(),
            isDefault: Joi.boolean().required(),
        })

        const { error } = emailSettingSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        let { _id, serverName, userName, password, port, enableSSL, fromEmail, isDefault } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await EmailSetting.findOne({
                serverName, userName, password, port, enableSSL, fromEmail, isDelete: false, _id: { $ne: _id }, licenseId: req.user.licenseId
            }).collation({ locale: 'en', strength: 2 });
        } catch (error) {
            return next(err);
        }

        //Updating Record
        if (result) {
            return next(CustomeErrorHandler.alreadyExist());
        } else {
            let upResult;
            try {
                upResult = await EmailSetting.findByIdAndUpdate(_id, {
                    $set: {
                        serverName, userName, password, port, enableSSL, fromEmail, isDefault,
                        userId: req.user._id,
                    }
                }, { new: true })
            } catch (error) {
                return next(error);
            }
            res.status(202).json(upResult._id);
        }

    },

    async delete(req, res, next) {
        const _id = req.params.id;
        let result;

        try {
            result = await EmailSetting.findByIdAndUpdate({ _id }, { userId: req.user._id, isDelete: true }, { new: true });
        } catch (error) {
            console.log(error);
            return next(error);
        }

        res.status(202).json(result._id);
    },

    async getAll(req, res, next) {
        let result;
        try {
            result = await EmailSetting.find({ isDelete: false, licenseId: req.user.licenseId })
                .populate('userId', '_id name')
                .select('-licenseId -createdAt -isDelete -updatedAt -__v')
                .sort({ serverName: 1 })
            return res.json(result);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },
}
export default emailSettingController