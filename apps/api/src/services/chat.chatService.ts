import { prisma} from "../prisma_client/client"
import { processMessagebyagent } from "../agents/master.agent"
import crypto from "crypto";
import { error } from "console";


export const chatService ={
  async createChatSession() {
    const user = await prisma.user.create({
      data: {},
    });
    return prisma.chat.create({
      data: {
        session_token: crypto.randomUUID(),
        userId: user.id,
      },
    });
  }
  ,

    async saveUserMessage(session_token:string,message:string){
      const chat = await prisma.chat.findUnique({
        where: { session_token: session_token },
      });
      if(!chat)return;
     return prisma.chatMessage.create({
        data:{
        chatId: chat?.id,
        sender: "user",
        content: message,
        created_at: new Date()
        }
     })
    },
    async saveAgentMessage(session_token: string, message: string) {
      const chat = await prisma.chat.findUnique({
        where: { session_token: session_token },
      });
      if(!chat)return;
        return prisma.chatMessage.create({
          data: {
            chatId: chat?.id,
            sender: "agent",
            content: message,
            created_at: new Date()
          }
        });
      },

      async processMessage(session_token: string, message: string) {
        //save usermessage
        await this.saveUserMessage(session_token,message);
        const chat = await prisma.chat.findUnique({
          where: { session_token },
          include: { loan: true,user:true },
        });
        if (!chat) {
          throw new Error("Chat session not found");
        }
        const loanId = chat.loan?.id;
        console.log(`the userid is ${chat?.user?.id}`);
        //let me call masteragent
        //master agent not created yet that is why showing error
        const aiReply = await processMessagebyagent({
            message,
            loanId,
            userId:chat?.user?.id
          });
          //save that reply
          await this.saveAgentMessage(session_token,aiReply);
          return aiReply;
      }

}