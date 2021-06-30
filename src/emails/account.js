const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email, 
        from: '205axn@gmail.com', 
        subject: 'Welcome!', 
        text: `Welcome to the app, ${name}. Let me know how you get along with the app. `
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email, 
        from: '205axn@gmail.com', 
        subject: 'Goodbye', 
        text: `Goodbye, ${name}. Was there anything we could've done to keep you?`
    })
}

module.exports = {
    sendWelcomeEmail, 
    sendCancellationEmail
}