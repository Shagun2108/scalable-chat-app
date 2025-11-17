import amqp from "amqplib";
let channel:amqp.Channel;

export const connectRabbitMq = async ()=>{
    try{
        const connection = await amqp.connect({
            protocol:'amqp',
            hostname:process.env.Rabbitmq_hostname,
            port:5672,
            username:process.env.Rabbitmq_username,
            password:process.env.Rabbitmq_password,
        });
        channel = await connection.createChannel();
        console.log("connected with rabbitMq");
        


    }catch(error){
        console.log('fialed to connecte to rabbitMq')
    }
};


export const publishToQueue = async (queueName:string,message:any)=>{

if(!channel){
    throw new Error("rabbit Mq cahnnel is not initailized");
    return
}

await channel.assertQueue(queueName,{durable:true});
channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)),{
    persistent:true
})
}
 