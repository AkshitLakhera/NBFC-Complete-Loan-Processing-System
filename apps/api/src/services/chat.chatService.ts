import prisma from "../prisma_client/client"
import { processMessage } from "../agents/master.agent"

export const chatService ={
    async createChatSession(){
       return prisma.chat.create({
        data:{
        created_at: new Date(),
        last_active_at: new Date(),
        session_token: crypto.randomUUID()
        }
       })
    },

    async saveUserMessage(sessionId:number,message:string){
     return prisma.chatMessage.create({
        data:{
        chatId: sessionId,
        sender: "user",
        content: message,
        created_at: new Date()
        }
     })
    },
    async saveAgentMessage(sessionId: number, message: string) {
        return prisma.chatMessage.create({
          data: {
            chatId: sessionId,
            sender: "agent",
            content: message,
            created_at: new Date()
          }
        });
      },

      async processMessage(sessionId: number, message: string) {
        //save usermessage
        await this.saveUserMessage(sessionId,message);
        //let me call masteragent
        //master agent not created yet that is why showing error
        const aiReply = await processMessage({
            sessionId,
            message
          });
          //save that reply
          await this.saveAgentMessage(sessionId,aiReply);
          return aiReply;
      }

}