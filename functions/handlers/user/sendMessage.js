const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mail.easypezy@gmail.com',
    pass: 'Helpdesk@12',
  },
});

exports.sendMessage = (req, res) => {
  // getting dest email by query string
  const body = req.body;

  const mailOptions = {
    from: 'EasyPezy Inc <mail.easypezy@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
    to: body,
    subject: "I'M A PICKLE!!!", // email subject
    html: `<p style="font-size: 16px;">Pickle Riiiiiiiiiiiiiiiick!!</p>
              <br />
              <img src="https://images.prod.meredith.com/product/fc8754735c8a9b4aebb786278e7265a5/1538025388228/l/rick-and-morty-pickle-rick-sticker" />
          `, // email content in HTML
  };

  // returning result
  return transporter.sendMail(mailOptions, (erro, info) => {
    if (erro) {
      return res.send(erro.toString());
    }
    return res.send('Sended');
  });
};
