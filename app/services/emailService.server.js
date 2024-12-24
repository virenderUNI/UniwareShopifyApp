import { findSenderReceiver, findShopifyUniwareTenant } from "../mao/uniwareSessionMao.server";
const nodemailer = require('nodemailer');

export async function sendEmail(action,shop) {
    const shopifyUniwareTenantDetails = await findShopifyUniwareTenant(shop);
    const senderReceiverDetails = await findSenderReceiver("GmailSMTP");
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: senderReceiverDetails.data.username,  
            pass: senderReceiverDetails.data.appPassword 
        },
        tls: {
            rejectUnauthorized: false 
          }
    });
    let mailMessage,mailSubject;
    switch (action) {
        case 'deactivateChannel':
            mailMessage = `Please Deactivate Shopify Channel for tenant ${shopifyUniwareTenantDetails.data.tenantCode}. Full Details: ${JSON.stringify(shopifyUniwareTenantDetails.data)}.`;
            mailSubject = `Shopify App Data REDACT Request | Deactivate Channel`
            break;
        case 'deactivateTenant':
            mailMessage = `Please Deactivate Tenant with code ${shopifyUniwareTenantDetails.data.tenantCode}. Full Details: ${JSON.stringify(shopifyUniwareTenantDetails.data)}.`;
            mailSubject = `Shopify App Data Uninstall Request | Deactivate Tenant`
            break;
        default:
            mailMessage = `Shopify App Uninstalled`;
            mailSubject = `Shopify App Data Uninstall Request | Deactivate Tenant`
    } 
    const mailOptions = {
        from: senderReceiverDetails.data.username,          
        to: senderReceiverDetails.data.receiverEmails,              
        subject: mailSubject,   
        text: mailMessage,        
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

}