package dev.jittakan.opschat.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import dev.jittakan.opschat.domain.Message;

@Controller
public class ChatController {

   private final SimpMessagingTemplate simpMessagingTemplate;

   public ChatController(SimpMessagingTemplate simpMessagingTemplate) {
       this.simpMessagingTemplate = simpMessagingTemplate;
   }

   @MessageMapping("/public-message")
   @SendTo("/opschat/public")
   public Message handlePublicMessage(@Payload Message message,
           SimpMessageHeaderAccessor headerAccessor) {
       if (message.getSenderName() != null) {
           headerAccessor.getSessionAttributes().put("username", message.getSenderName());
       }
       return message;
   }

   @MessageMapping("/private-message")
   public Message handlePrivateMessage(@Payload Message message) {
       simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(),"/private",message);
       return message;
   }

}
