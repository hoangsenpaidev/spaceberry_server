const { UserModel } = require('../models/user')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const emailvalidator = require("email-validator");
const fs = require('fs');

require("dotenv").config();

let refreshTokens = [];

const authController = {

    //get otpcode
    getOtp: async(req, res) => {
        function generateOtpCode(n) {
            var code = "";
            const possible = "0123456789";
            for (let i = 0; i < n; i++)
                code += possible.charAt(Math.floor(Math.random() * possible.length));
            return code;
        }

        const otpcode = generateOtpCode(5)

        try {
            const email = req.body.email.trim().toLowerCase()

            if (!emailvalidator.validate(req.body.email))
                return res.status(409).json({
                    status: false,
                    message: 'Email không hợp lệ!'
                })

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.MAIL_ACCOUNT,
                    pass: process.env.MAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.MAIL_ACCOUNT,
                to: email,
                subject: 'Email verification code: ' + otpcode,
                html: ` <div style="text-align:center;">
                    <div style="width:500px; margin: 0 auto;">
                    <div style="text-align:center; ">
                      <div style="font-family: 'Pacifico', cursive; font-size:40px; color:#F2796B; font-weight:bold">SPACEBERRY</div>
                      <div style="font-family:'ROBOTO';font-size:25px;">Xác nhận email của bạn</div>
                    </div>
                      <hr>
                  <div style="font-family:'ROBOTO';">Sử dụng mã này để hoàn tất thiết lập tài khoản:</div>
                  <br>
                  <div style="text-align:center; font-family:'ROBOTO'; font-size:35px;">${otpcode} </div>
                  <br>
                  <div style="font-family:'ROBOTO';"> Mã này sẽ hết hạn sau 24 giờ.</div>
                  <br>
                  <div style="font-family:'ROBOTO';">Nếu bạn không nhận ra nó, bạn có thể bỏ qua email này một cách an toàn.</div>
                  </div>`
            };

            const emailCheck = await UserModel.findOne({ email })
            if (emailCheck) {
                if (emailCheck.active) {
                    return res.status(409).json({
                        status: false,
                        message: 'Email đã được sử dụng'
                    })
                } else {
                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) console.log('Lỗi rồi: ' + error);
                        else console.log('Email sent: ' + info.response)
                    });
                    await emailCheck.updateOne({ $set: { otpcode: otpcode } })
                    return res.status(200).json({ status: true });
                }
            } else {
                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) console.log('Lỗi rồi: ' + error);
                    else console.log('Email sent: ' + info.response)
                });
                await UserModel.create({ email: email, otpcode: otpcode })
                return res.status(200).json({ status: true });
            }
        } catch (error) {
            const response = { status: false, message: error }
            res.status(500).json(response)
        }
    },

    //enter otpcode
    enterOtp: async(req, res) => {
        try {
            const { email, otpcode } = req.body
            if (otpcode.length == 5) {
                const user = await UserModel.findOne({ otpcode: otpcode, email: email })

                if (user != null) return res.status(200).json({
                    status: true,
                    data: { otpcode: otpcode, email: email }
                })
                else return res.status(409).json({
                    status: false,
                    message: 'Mã xác nhận không chính xác!'
                })
            } else {
                return res.status(409).json({
                    status: false,
                    message: 'Mã xác nhận không hợp lệ!'
                })
            }
        } catch (error) {
            res.status(500).json({ status: false, message: error })
        }
    },

    //sign up account
    signUp: async(req, res) => {
        try {
            const { email, otpcode, username, password } = req.body
            const encryptedPassword = await bcrypt.hash(password, 10);
            const user = await UserModel.findOne({ email: email, otpcode: otpcode })

            const data = {
                _id: user._id,
                email: user.email,
                username: user.username,
                domain: user.domain,
                image: user.image,
                national: user.national,
                joindate: user.joindate
            }

            // Create access_oken
            const access_token = jwt.sign(data, process.env.ACCESS_TOKEN_KEY, { expiresIn: "1h" });

            // Create refresh_token
            const refresh_token = jwt.sign(data, process.env.REFRESH_TOKEN_KEY, { expiresIn: "7d" });

            // Set refersh token in refreshTokens array
            refreshTokens.push(refresh_token)

            //update db
            await user.updateOne({
                $set: {
                    username: username,
                    password: encryptedPassword,
                    joindate: user.updatedAt,
                    active: true
                }
            })

            return res.status(200).json({
                status: true,
                data: {
                    access_token: access_token,
                    refresh_token: refresh_token,
                }
            })

        } catch (error) {
            res.status(500).json({ status: false, message: error })
        }
    },

    //sign in 
    signIn: async(req, res) => {
        try {
            const { email, password } = req.body
            const user = await UserModel.findOne({ email: email })

            if (user && bcrypt.compare(password, user.password)) {
                const data = {
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    domain: user.domain,
                    image: user.image,
                    national: user.national,
                    joindate: user.joindate
                }

                // Create access_oken
                const access_token = jwt.sign(data, process.env.ACCESS_TOKEN_KEY, { expiresIn: "1h" });

                // Create refresh_token
                const refresh_token = jwt.sign(data, process.env.REFRESH_TOKEN_KEY, { expiresIn: "7d" });

                // Set refersh token in refreshTokens array
                refreshTokens.push(refresh_token)

                return res.status(200).json({
                    status: true,
                    data: {
                        access_token: access_token,
                        refresh_token: refresh_token,
                    }
                })
            } else {
                return res.status(409).json({
                    status: false,
                    message: 'Email hoặc mật khẩu không chính xác!'
                });
            }

        } catch (error) {
            res.status(500).json({ status: false, message: error })
        }
    },

    //log out
    logout: async(req, res) => {
        const refresh_token = req.header("x-auth-token");
        refreshTokens = refreshTokens.filter((token) => token !== refresh_token);
        return res.status(200).json({ status: true });
    },

    // Create new access token from refresh token
    token: async(req, res) => {
        const refresh_token = req.header("x-auth-token")

        if (!refresh_token) return res.status(401).json({
            status: false,
            message: "Token not found",
        });

        // If token does not exist, send error message
        if (!refreshTokens.includes(refresh_token)) return res.status(403).json({
            status: false,
            message: "Invalid refresh token",
        });

        try {
            const user = jwt.verify(
                refresh_token,
                process.env.REFRESH_TOKEN_KEY
            );

            const data = {
                _id: user._id,
                email: user.email,
                username: user.username,
                domain: user.domain,
                image: user.image,
                national: user.national,
                joindate: user.joindate
            }

            const access_token = jwt.sign(data,
                process.env.ACCESS_TOKEN_KEY, { expiresIn: "1h" }
            );

            return res.json({ status: true, data: access_token });

        } catch (error) {
            res.status(500).json({ status: false, message: error })
        }
    }


}


module.exports = authController