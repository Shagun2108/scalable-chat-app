import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

export const startSendOtpConsumer = async () => {
    
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_hostname,
      port: 5672,
      username: process.env.Rabbitmq_username,
      password: process.env.Rabbitmq_password,
    });

    const channel = await connection.createChannel()
    const queueName = "send-otp"
    await channel.assertQueue(queueName,{durable:true})

    console.log("mail service consumer strated ,listeng for otp emails");
    channel.consume(queueName,async(msg)=>{
        if(msg){
            try{
                const {to,subject,body} = JSON.parse(msg.content.toString())
                const transporter = nodemailer.createTransport({
                    host:'smtp.gmail.com',
                    port:465,
                    auth:{
                        user:process.env.USER,
                        pass:process.env.PASSWORD
                    }
                });
                await transporter.sendMail({
                    from:"chat app",
                    to,
                    subject,
                    text:body,
                })

                console.log(`OTP mail sent to ${to}`);
                channel.ack(msg);
                


            }catch(error){
                console.log(`failed to send otp`,error);
                

            }
        }
    })
    
  } catch (error) {
    console.log("failed to strat rabbitmq consumer",error);
  }
};
