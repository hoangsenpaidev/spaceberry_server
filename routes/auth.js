const authController = require('../controllers/auth')
const authjwt = require("../middleware/authenticate_token")

const router = require('express').Router()

//get otp
router.post('/get-otp', authController.getOtp)

//enter otp
router.post('/enter-otp', authController.enterOtp)

//sign up
router.post('/sign-up', authController.signUp)

//sign in 
router.post('/sign-in', authController.signIn)

//sign in 
router.delete('/log-out', authController.logout)

//token
router.post("/token", authController.token)

router.get("/welcome", authjwt, (req, res) => {
    res.status(200).send("Welcome 🙌 ");
});


module.exports = router;