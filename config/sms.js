/**
 * 短信发送配置
 * @author Trayvon <https://github.com/Trayvon21>
 */
const SMSClient = require("@alicloud/sms-sdk");
// 导入秘钥
const { accessKeyId, secretAccessKey } = require("./keys");
//初始化sms_client
let smsClient = new SMSClient({ accessKeyId, secretAccessKey });
//导出smsClient
module.exports = smsClient;
