const nodemailer = require("nodemailer")
const googleApis = require("googleapis");
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `68962659659-fobd605me4oijc3929lb2gr8dmgu1f0o.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04yBzMeSYRa7XCgYIARAAGAQSNwF-L9IrSDbG7u0gWz6S9GDX-DYFKzUoGX2CxdWL-9IUEjJ-JdqRAp89bCyPkHbB3WWISJjfHB4`;
const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
REDIRECT_URI);
authClient.setCredentials({refresh_token: REFRESH_TOKEN});

async function mailer(){
 try{
 const ACCESS_TOKEN = await authClient.getAccessToken();
 const transport = nodemailer.createTransport({
 service: "gmail",
 auth: {
 type: "OAuth2",
 user: "shivanshusamadhiya@gmail.com",
 clientId: CLIENT_ID,
 clientSecret: CLIENT_SECRET,
 refreshToken: REFRESH_TOKEN,
 accessToken: ACCESS_TOKEN
 }
 })
 const details = {
 from: "shivanshu <shivanshusamadhiya@mail.com>",
 to: "shivanshusamadhiya23@gmail.com",
 subject: "Text Email",
 text: "to inform about your text message",
 html: "<h2>hiiii you are ?</h2>"
 }
 const result = await transport.sendMail(details);
 return result;
 }
 catch(err){
 return err;
 }
}

module.exports = mailer;