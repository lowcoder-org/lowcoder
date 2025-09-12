import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import styled, { css } from "styled-components";
import { UICompBuilder } from "../../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../../generators/withExposing";
import { TextStyle, TextStyleType, AnimationStyle, AnimationStyleType } from "comps/controls/styleControlConstants";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import React, { useContext, useEffect, useRef, useMemo, useState } from "react";
import { EditorContext } from "comps/editorState";
import { ToViewReturn } from "../../generators/multi";
import { useCompClickEventHandler } from "../../utils/useCompClickEventHandler";
import { Button, Input, Modal, Form, Radio, Space, Typography, Divider, Badge, Tooltip, Popconfirm } from "antd";
import { PlusOutlined, SearchOutlined, GlobalOutlined, LockOutlined, UserOutlined, CheckCircleOutlined, LogoutOutlined } from "@ant-design/icons";
import { useChatManager } from "./hooks/useChatManager";
import { UnifiedMessage } from "./types/chatDataTypes";
import { chatCompChildrenMap, ChatCompChildrenType } from "./chatUtils";

// // Event options for the chat component
// const EventOptions = [clickEvent, doubleClickEvent] as const;

// Chat component styling
const ChatContainer = styled.div<{
  $styleConfig: TextStyleType;
  $animationStyle: AnimationStyleType;
}>`
  height: 100%;
  display: flex;
  overflow: hidden;
  border-radius: ${(props) => props.$styleConfig.radius || "4px"};
  border: ${(props) => props.$styleConfig.borderWidth || "1px"} solid ${(props) => props.$styleConfig.border || "#e0e0e0"};
  background: ${(props) => props.$styleConfig.background || "#ffffff"};
  font-family: ${(props) => props.$styleConfig.fontFamily || "Inter, sans-serif"};
  ${(props) => props.$animationStyle}
`;

const LeftPanel = styled.div<{ $width: string }>`
  width: ${(props) => props.$width};
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(180deg, transparent 0%, #e6f7ff 50%, transparent 100%);
    opacity: 0.5;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const ChatHeader = styled.div<{ $styleConfig: TextStyleType }>`
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: ${(props) => props.$styleConfig.background || "#ffffff"};
  font-size: ${(props) => props.$styleConfig.textSize || "16px"};
  font-weight: ${(props) => props.$styleConfig.textWeight || "600"};
  color: ${(props) => props.$styleConfig.text || "#1a1a1a"};
`;

const RoomsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 8px;
  padding: 0 8px;
`;

const RoomItem = styled.div<{ $isActive?: boolean; $styleConfig: TextStyleType }>`
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 8px;
  cursor: pointer;
  background: ${(props) => props.$isActive ? props.$styleConfig.links || "#1890ff" : "#ffffff"};
  color: ${(props) => props.$isActive ? "#ffffff" : props.$styleConfig.text || "#262626"};
  font-size: ${(props) => props.$styleConfig.textSize || "13px"};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid ${(props) => props.$isActive ? "transparent" : "#f0f0f0"};
  box-shadow: ${(props) => props.$isActive ? "0 3px 8px rgba(24, 144, 255, 0.15)" : "0 1px 2px rgba(0, 0, 0, 0.04)"};
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: ${(props) => props.$isActive ? props.$styleConfig.links || "#1890ff" : "#fafafa"};
    transform: translateY(-1px);
    box-shadow: ${(props) => props.$isActive ? "0 4px 10px rgba(24, 144, 255, 0.2)" : "0 3px 8px rgba(0, 0, 0, 0.1)"};
    border-color: ${(props) => props.$isActive ? "transparent" : "#d9d9d9"};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div<{ $isOwn: boolean; $styleConfig: TextStyleType }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  align-self: ${(props) => props.$isOwn ? "flex-end" : "flex-start"};
  background: ${(props) => props.$isOwn ? (props.$styleConfig.links || "#007bff") : "#f1f3f4"};
  color: ${(props) => props.$isOwn ? "#ffffff" : (props.$styleConfig.text || "#333")};
  font-size: ${(props) => props.$styleConfig.textSize || "14px"};
  word-wrap: break-word;
`;

const MessageInput = styled.div`
  padding: 16px;
  border-top: 1px solid #e0e0e0;
    display: flex;
  gap: 8px;
  align-items: center;
`;

const InputField = styled.textarea<{ $styleConfig: TextStyleType }>`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  resize: none;
  max-height: 100px;
  min-height: 40px;
  font-family: ${(props) => props.$styleConfig.fontFamily || "Inter, sans-serif"};
  font-size: ${(props) => props.$styleConfig.textSize || "14px"};
  color: ${(props) => props.$styleConfig.text || "#333"};
  outline: none;
  
  &:focus {
    border-color: ${(props) => props.$styleConfig.links || "#007bff"};
  }
`;

const SendButton = styled.button<{ $styleConfig: TextStyleType }>`
  padding: 8px 16px;
  background: ${(props) => props.$styleConfig.links || "#007bff"};
  color: #ffffff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: ${(props) => props.$styleConfig.textSize || "14px"};
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div<{ $styleConfig: TextStyleType }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${(props) => props.$styleConfig.text || "#666"};
  font-size: ${(props) => props.$styleConfig.textSize || "14px"};
  text-align: center;
  gap: 8px;
`;

const ConnectionStatus = styled.div<{ $connected: boolean; $styleConfig: TextStyleType }>`
  padding: 8px 16px;
  background: ${(props) => props.$connected ? "#d4edda" : "#f8d7da"};
  color: ${(props) => props.$connected ? "#155724" : "#721c24"};
  font-size: 12px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
`;

const TypingIndicator = styled.div<{ $styleConfig: TextStyleType }>`
  padding: 8px 16px;
  font-size: 12px;
  color: #666;
  font-style: italic;
  opacity: 0.8;
  border-bottom: 1px solid #e0e0e0;
  background: #f9f9f9;
  
  .typing-dots {
    display: inline-block;
    margin-left: 8px;
  }
  
  .typing-dots span {
    display: inline-block;
    background-color: #bbb;
    border-radius: 50%;
    width: 4px;
    height: 4px;
    margin: 0 1px;
    animation: typing 1.4s infinite ease-in-out both;
  }
  
  .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
  .typing-dots span:nth-child(3) { animation-delay: 0s; }
  
  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.3;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

// Property view component
const ChatPropertyView = React.memo((props: {
  children: ChatCompChildrenType
}) => {
  const editorContext = useContext(EditorContext);
  const editorModeStatus = useMemo(() => editorContext.editorModeStatus, [editorContext.editorModeStatus]);

  const basicSection = useMemo(() => (
    <Section name={sectionNames.basic}>
      {props.children.chatName.propertyView({
        label: "Chat Name",
        tooltip: "Name displayed in the chat header"
      })}
      {props.children.userId.propertyView({
        label: "User ID",
        tooltip: "Unique identifier for the current user"
      })}
      {props.children.userName.propertyView({
        label: "User Name",
        tooltip: "Display name for the current user"
      })}
      {props.children.applicationId.propertyView({
        label: "Application ID",
        tooltip: "Unique identifier for this Lowcoder application - all chat components with the same Application ID can discover each other's rooms"
      })}
      {props.children.roomId.propertyView({
        label: "Initial Room",
        tooltip: "Default room to join when the component loads (within the application scope)"
      })}
      {props.children.mode.propertyView({
        label: "Sync Mode",
        tooltip: "Choose how messages are synchronized: Collaborative (real-time), Hybrid (local + real-time), or Local only"
      })}
    </Section>
  ), [props.children]);

  const roomManagementSection = useMemo(() => (
    <Section name="Room Management">
      {props.children.allowRoomCreation.propertyView({
        label: "Allow Room Creation",
        tooltip: "Allow users to create new chat rooms"
      })}
      {props.children.allowRoomJoining.propertyView({
        label: "Allow Room Joining",
        tooltip: "Allow users to join existing rooms"
      })}
      {props.children.roomPermissionMode.propertyView({
        label: "Permission Mode",
        tooltip: "Control how users can join rooms"
      })}
      {props.children.showAvailableRooms.propertyView({
        label: "Show Available Rooms",
        tooltip: "Display list of available rooms to join"
      })}
      {props.children.maxRoomsDisplay.propertyView({
        label: "Max Rooms to Display",
        tooltip: "Maximum number of rooms to show in the list"
      })}
    </Section>
  ), [props.children]);

  const interactionSection = useMemo(() => 
    ["logic", "both"].includes(editorModeStatus) && (
      <Section name={sectionNames.interaction}>
        {hiddenPropertyView(props.children)}
        {props.children.onEvent.getPropertyView()}
      </Section>
    ), [editorModeStatus, props.children]);

  const layoutSection = useMemo(() => 
    ["layout", "both"].includes(editorModeStatus) && (
      <>
        <Section name={sectionNames.layout}>
          {props.children.autoHeight.getPropertyView()}
          {props.children.leftPanelWidth.propertyView({
            label: "Left Panel Width",
            tooltip: "Width of the rooms/people panel (e.g., 300px, 25%)"
          })}
          {props.children.showRooms.propertyView({
            label: "Show Rooms"
          })}
        </Section>
        <Section name={sectionNames.style}>
          {props.children.style.getPropertyView()}
        </Section>
        <Section name={sectionNames.animationStyle} hasTooltip={true}>
          {props.children.animationStyle.getPropertyView()}
        </Section>
      </>
    ), [editorModeStatus, props.children]);

  return (
    <>
      {basicSection}
      {roomManagementSection}
      {interactionSection}
      {layoutSection}
    </>
  );
});

// Main view component
const ChatBoxView = React.memo((props: ToViewReturn<ChatCompChildrenType>) => {
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [joinedRooms, setJoinedRooms] = useState<any[]>([]);
  const [searchableRooms, setSearchableRooms] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [createRoomForm] = Form.useForm();
  const handleClickEvent = useCompClickEventHandler({onEvent: props.onEvent});
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize chat manager  
  const modeValue = props.mode as 'local' | 'collaborative' | 'hybrid';
  
  const chatManager = useChatManager({
    userId: props.userId.value || "user_1",
    userName: props.userName.value || "User",
    applicationId: props.applicationId.value || "lowcoder_app", 
    roomId: props.roomId.value || "general",
    mode: modeValue, // Use mode from props
    autoConnect: true,
  });
  
  // Load joined rooms when connected
  useEffect(() => {
    const loadRooms = async () => {
      if (chatManager.isConnected) {
        try {
          console.log('[ChatBox] 🔄 Loading joined rooms...');
          const allRooms = await chatManager.getAvailableRooms();
          console.log('[ChatBox] 🔍 getAvailableRooms result:', allRooms);
          
          if (!allRooms || !Array.isArray(allRooms)) {
            console.warn('[ChatBox] ⚠️ getAvailableRooms returned undefined or invalid data:', allRooms);
            // Keep existing joined rooms if API fails
            return;
          }
          
          // Filter to only show rooms the user is a member of
          // Participants can be either strings (user IDs) or objects with id property
          const userJoinedRooms = allRooms.filter((room: any) => {
            if (!room.participants) {
              console.log(`[ChatBox] 🔍 Room "${room.name}" has no participants - excluding`);
              return false;
            }
            
            console.log(`[ChatBox] 🔍 Checking room "${room.name}" participants:`, room.participants, 'vs current user:', props.userId.value);
            console.log(`[ChatBox] 🔍 Current userName: "${props.userName.value}"`);  
            
            const isUserInRoom = room.participants.some((p: any) => {
              // Handle both string participants (just user IDs) and object participants
              const participantId = typeof p === 'string' ? p : p.id;
              const isMatch = participantId === props.userId.value;
              console.log(`[ChatBox] 🔍 Participant ${participantId} === ${props.userId.value}? ${isMatch}`);
              return isMatch;
            });
            
            console.log(`[ChatBox] 🔍 Room "${room.name}" - User is ${isUserInRoom ? 'MEMBER' : 'NOT MEMBER'}`);
            return isUserInRoom;
          });
          console.log('[ChatBox] 📋 Found joined rooms:', userJoinedRooms.map((r: any) => r.name));
          setJoinedRooms(userJoinedRooms);
        } catch (error) {
          console.error('[ChatBox] 💥 Failed to load joined rooms:', error);
        }
      }
    };
    
    loadRooms();
  }, [chatManager.isConnected, props.userId.value, chatManager.getAvailableRooms]);

  // Refresh joined rooms periodically
  useEffect(() => {
    if (!chatManager.isConnected) return;
    
    const refreshInterval = setInterval(async () => {
      try {
        console.log('[ChatBox] 🔄 Refreshing joined rooms...');
        const allRooms = await chatManager.getAvailableRooms();
        console.log('[ChatBox] 🔍 Refresh getAvailableRooms result:', allRooms);
        
        if (!allRooms || !Array.isArray(allRooms)) {
          console.warn('[ChatBox] ⚠️ Refresh getAvailableRooms returned undefined or invalid data:', allRooms);
          // Skip this refresh cycle if data is invalid
          return;
        }
        
        const userJoinedRooms = allRooms.filter((room: any) => {
          if (!room.participants) return false;
          
          return room.participants.some((p: any) => {
            // Handle both string participants (just user IDs) and object participants
            const participantId = typeof p === 'string' ? p : p.id;
            return participantId === props.userId.value;
          });
        });
        setJoinedRooms(userJoinedRooms);
        console.log('[ChatBox] 📋 Refreshed joined rooms count:', userJoinedRooms.length);
      } catch (error) {
        console.error('[ChatBox] 💥 Failed to refresh joined rooms:', error);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [chatManager.isConnected, props.userId.value, chatManager.getAvailableRooms]);

  // Room management functions
  const handleCreateRoom = async (values: any) => {
    try {
      const newRoom = await chatManager.createRoomFromRequest({
        name: values.roomName.trim(),
        type: values.roomType,
        description: values.description || `Created by ${props.userName.value}`
      });
      
      if (newRoom) {
        console.log('[ChatBox] ✅ Created room:', newRoom.name);
        
        // Automatically join the room as the creator
        const joinSuccess = await chatManager.joinRoom(newRoom.id);
        
        // Always add the room to joined rooms regardless of join success
        // This ensures the UI works even if there are backend sync issues
        const roomWithUser = {
          ...newRoom,
          participants: [
            ...(newRoom.participants || []),
            { id: props.userId.value, name: props.userName.value }
          ]
        };
        
        // Add to joined rooms immediately
        setJoinedRooms(prev => [...prev, roomWithUser]);
        
        if (joinSuccess) {
          console.log('[ChatBox] ✅ Creator automatically joined the room');
          console.log('[ChatBox] 📋 Created room added to joined rooms and set as active');
        } else {
          console.warn('[ChatBox] ⚠️ Failed to auto-join created room, but room added to local state');
        }
        
        // Reset form and close modal
        createRoomForm.resetFields();
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      console.log('[ChatBox] 🚪 Attempting to join room:', roomId);
      const success = await chatManager.joinRoom(roomId);
      if (success) {
        console.log('[ChatBox] ✅ Successfully joined room:', roomId);
        
        // Find the room from search results
        const roomToAdd = searchResults.find((room: any) => room.id === roomId);
        if (roomToAdd) {
          // Add current user to participants for immediate local state update
          const roomWithUser = {
            ...roomToAdd,
            participants: [
              ...(roomToAdd.participants || []),
              { id: props.userId.value, name: props.userName.value }
            ]
          };
          
          // Add to joined rooms immediately
          setJoinedRooms(prev => [...prev, roomWithUser]);
          console.log('[ChatBox] 📋 Added room to joined rooms locally');
        }
        
        // Remove the joined room from search results
        setSearchResults(prev => prev.filter((room: any) => room.id !== roomId));
        
        // Clear search state to show joined rooms
        setSearchQuery("");
        setShowSearchResults(false);
        
        console.log('[ChatBox] 📋 Room join completed successfully');
      } else {
        console.log('[ChatBox] ❌ Failed to join room:', roomId);
      }
    } catch (error) {
      console.error('[ChatBox] 💥 Error joining room:', error);
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    try {
      console.log('[ChatBox] 🚪 Attempting to leave room:', roomId);
      const success = await chatManager.leaveRoom(roomId);
      if (success) {
        console.log('[ChatBox] ✅ Successfully left room:', roomId);
        
        // Remove the room from joined rooms immediately
        const updatedJoinedRooms = joinedRooms.filter((room: any) => room.id !== roomId);
        setJoinedRooms(updatedJoinedRooms);
        
        // If user left the current room, switch to another joined room or clear chat
        if (currentRoom?.id === roomId) {
          if (updatedJoinedRooms.length > 0) {
            await chatManager.joinRoom(updatedJoinedRooms[0].id);
          } else {
            // No more rooms joined, user needs to search and join a room
            console.log('[ChatBox] ℹ️ No more joined rooms, user needs to search for rooms');
          }
        }
      } else {
        console.log('[ChatBox] ❌ Failed to leave room:', roomId);
      }
    } catch (error) {
      console.error('[ChatBox] 💥 Error leaving room:', error);
    }
  };

  // Search functionality - searches all available rooms, not just joined ones
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('[ChatBox] 🔍 Searching for rooms:', query);
      
      // Get all available rooms and filter by search query
      const allRooms = await chatManager.getAvailableRooms();
      console.log('[ChatBox] 🔍 Search getAvailableRooms result:', allRooms);
      
      if (!allRooms || !Array.isArray(allRooms)) {
        console.warn('[ChatBox] ⚠️ Search getAvailableRooms returned undefined or invalid data:', allRooms);
        setSearchResults([]);
        setShowSearchResults(true);
        return;
      }
      
      console.log('[ChatBox] 🔍 All available rooms count:', allRooms.length);
      console.log('[ChatBox] 🔍 User ID for filtering:', props.userId.value);
      
      // Show all public rooms that match search, regardless of current membership
      const filtered = allRooms.filter((room: any) => {
        console.log(`[ChatBox] 🔍 Filtering room "${room.name}" with query: "${query}"`);
        
        if (!query || typeof query !== 'string') {
          console.warn(`[ChatBox] ⚠️ Invalid query:`, query);
          return false;
        }
        
        if (!room.name || typeof room.name !== 'string') {
          console.warn(`[ChatBox] ⚠️ Invalid room name:`, room.name);
          return false;
        }
        
        const matchesSearch = room.name.toLowerCase().includes(query.toLowerCase()) ||
          (room.description && room.description.toLowerCase().includes(query.toLowerCase()));
        
        // For public rooms, show them even if user is not a member (they can join)
        // For private rooms, only show if user is already a member
        const canAccess = room.type === 'public' || 
          (room.participants && room.participants.some((p: any) => {
            const participantId = typeof p === 'string' ? p : p.id;
            return participantId === props.userId.value;
          }));
        
        console.log(`[ChatBox] 🔍 Room "${room.name}" (${room.type}): query="${query}", matchesSearch=${matchesSearch}, canAccess=${canAccess}, participants:`, room.participants);
        
        return matchesSearch && canAccess;
      });
      
      console.log('[ChatBox] 🔍 Filtered rooms:', filtered.map((r: any) => ({
        name: r.name,
        id: r.id,
        participants: r.participants?.length || 0
      })));
      
      setSearchResults(filtered);
      setShowSearchResults(true);
      console.log('[ChatBox] 🔍 Search results:', filtered.length, 'rooms found');
    } catch (error) {
      console.error('[ChatBox] 💥 Error searching rooms:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log(`[ChatBox] 🔍 Search input changed to: "${query}"`);
    setSearchQuery(query);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      console.log(`[ChatBox] 🔍 Executing debounced search with query: "${query}"`);
      handleSearch(query);
    }, 300);
  };

  const { 
    isConnected, 
    isLoading, 
    error, 
    currentRoom, 
    messages, 
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping 
  } = chatManager;

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing management
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCurrentMessage(newValue);
    
    if (newValue.trim() && isConnected) {
      // Only start typing if we weren't already typing
      if (!isTypingRef.current) {
        console.log('[ChatBox] 🖊️ Starting typing indicator');
        startTyping();
        isTypingRef.current = true;
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        console.log('[ChatBox] 🖊️ Stopping typing indicator (timeout)');
        stopTyping();
        isTypingRef.current = false;
      }, 2000);
    } else if (!newValue.trim()) {
      // Stop typing immediately if input is empty
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (isTypingRef.current) {
        console.log('[ChatBox] 🖊️ Stopping typing indicator (empty input)');
        stopTyping();
        isTypingRef.current = false;
      }
    }
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim()) {
      // Stop typing before sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (isTypingRef.current) {
        console.log('[ChatBox] 🖊️ Stopping typing indicator (sending message)');
        stopTyping();
        isTypingRef.current = false;
      }
      
      const success = await sendMessage(currentMessage.trim());
      
      if (success) {
        setCurrentMessage("");
        handleClickEvent(); 
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        stopTyping();
      }
    };
  }, [stopTyping]);

  // Process rooms for display
  const baseRooms = showSearchResults ? searchResults : joinedRooms;
  const displayRooms = baseRooms.map((room: any) => ({
    id: room.id,
    name: room.name,
    type: room.type,
    active: currentRoom?.id === room.id,
    participantCount: room.participants?.length || 0,
    canJoin: showSearchResults, // Can only join rooms found through search
    isSearchResult: showSearchResults
  }));

  // When showing search results, we don't need to add current room
  // When showing joined rooms, all rooms are already joined by definition



  return (
    <ChatContainer 
      $styleConfig={props.style} 
      $animationStyle={props.animationStyle}
    >
      {/* Left Panel - Combined Content */}
      <LeftPanel $width={props.leftPanelWidth}>
        {/* Connection Status */}
        {!isConnected && (
          <ConnectionStatus $connected={isConnected} $styleConfig={props.style}>
            {isLoading ? "Connecting..." : error ? `Error: ${error}` : "Disconnected"}
          </ConnectionStatus>
        )}
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
          {props.showRooms && (
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#666', 
                marginBottom: '12px',
                padding: '0 4px'
              }}>
                Chat Rooms
              </div>
              <div style={{ marginBottom: '16px' }}>
                {/* Modern Create Room Modal */}
                {/* Create Room Button - Modern Design */}
                {props.allowRoomCreation && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    block
                    size="small"
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{ 
                      borderRadius: '6px',
                      height: '32px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Create Room
                  </Button>
                )}
              </div>

              <RoomsSection>
                {/* Modern Search UI */}
                <div style={{ marginBottom: '16px' }}>
                  <Input.Search
                    placeholder="Search rooms..."
                    prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    loading={isSearching}
                    style={{ 
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}
                    size="middle"
                    allowClear
                    onClear={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }}
                  />
                  {showSearchResults && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#262626', 
                      marginBottom: '12px',
                      padding: '12px 16px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e1e4e8'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: searchResults.length > 0 ? '4px' : '0'
                      }}>
                        <SearchOutlined style={{ color: '#666', fontSize: '14px' }} />
                        <span style={{ fontWeight: '600', color: '#262626' }}>
                          Search Results
                        </span>
                      </div>
                      {searchResults.length === 0 ? (
                        <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                          No rooms match "{searchQuery}"
                        </div>
                      ) : (
                        <div style={{ color: '#595959', fontSize: '12px' }}>
                          Found {searchResults.length} room{searchResults.length === 1 ? '' : 's'} matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Clear Search Button - Modern */}
                {showSearchResults && (
                  <div style={{ marginBottom: '12px' }}>
                    <Button 
                      type="text" 
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchResults(false);
                        setSearchResults([]);
                      }}
                      style={{ 
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#1890ff',
                        fontWeight: '500',
                        border: '1px solid #e1e4e8',
                        borderRadius: '6px',
                        background: '#ffffff',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      ← Back to My Rooms
                    </Button>
                  </div>
                )}

                {/* Room List */}
                {displayRooms.length === 0 && isConnected && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    fontSize: '12px', 
                    padding: '16px 8px',
                    fontStyle: 'italic'
                  }}>
                    {showSearchResults ? (
                      searchQuery ? `No rooms found for "${searchQuery}"` : 'Enter a search term to find rooms'
                    ) : (
                      <>
                        <div style={{ marginBottom: '8px' }}>
                          🏠 You haven't joined any rooms yet
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>
                          {props.allowRoomCreation 
                            ? 'Create a new room or search to join existing ones' 
                            : 'Search to find and join existing rooms'
                          }
                        </div>
                      </>
                    )}
                  </div>
                )}
                {displayRooms.map((room: any) => (
                  <RoomItem
                    key={room.id}
                    $isActive={room.active}
                    $styleConfig={props.style}
                    onClick={() => {
                      if (!room.active) {
                        if (room.canJoin && props.allowRoomJoining) {
                          // Join a new room from search results
                          handleJoinRoom(room.id);
                        } else if (!room.canJoin) {
                          // Switch to an already joined room
                          chatManager.setCurrentRoom(room.id);
                        }
                      }
                    }}
                    style={{ 
                      cursor: (!room.active) ? 'pointer' : 'default',
                      opacity: room.active ? 1 : 0.8,
                      transition: 'all 0.2s',
                      border: room.active 
                        ? '1px solid #52c41a' 
                        : room.isSearchResult 
                          ? '1px solid #d1ecf1'
                          : '1px solid transparent',
                      boxShadow: room.isSearchResult 
                        ? '0 2px 4px rgba(0, 0, 0, 0.08)'
                        : undefined
                    }}
                    title={
                      room.active 
                        ? 'Current room' 
                        : room.canJoin 
                          ? `Click to join "${room.name}"` 
                          : `Click to switch to "${room.name}"`
                    }
                  >
                    {/* Room Icon and Name */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                      {room.type === 'public' ? (
                        <GlobalOutlined style={{ fontSize: '12px', color: room.active ? '#ffffff' : '#52c41a', flexShrink: 0, marginTop: '3px', marginRight: '6px' }} />
                      ) : (
                        <LockOutlined style={{ fontSize: '12px', color: room.active ? '#ffffff' : '#ff7a45', flexShrink: 0, marginTop: '3px', marginRight: '6px' }} />
                      )}
                      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <Typography.Text 
                          strong 
                          style={{ 
                            color: room.active ? 'inherit' : '#262626',
                            fontSize: room.isSearchResult ? '15px' : '14px',
                            fontWeight: room.isSearchResult ? '700' : '600',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textShadow: room.active ? 'none' : '0 1px 1px rgba(255, 255, 255, 0.8)',
                            maxWidth: '100%',
                            display: 'block'
                          }}
                          title={room.name}
                        >
                          {room.name}
                        </Typography.Text>
                        
                        {/* Room Metadata */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <Space size={3}>
                            <UserOutlined style={{ fontSize: '11px', opacity: 0.7 }} />
                            <Typography.Text 
                              style={{ 
                                fontSize: '11px', 
                                color: 'inherit',
                                opacity: 0.8,
                                margin: 0
                              }}
                            >
                              {room.participantCount}
                            </Typography.Text>
                          </Space>
                          
                          {room.active && (
                            <CheckCircleOutlined 
                              style={{ 
                                fontSize: '12px', 
                                color: '#52c41a', 
                                marginTop: '2px'
                              }} 
                            />
                          )}
                          
                          {room.isSearchResult && !room.active && (
                            <div style={{
                              background: '#f0f0f0',
                              color: '#666',
                              fontSize: '10px',
                              fontWeight: '600',
                              height: '18px',
                              lineHeight: '18px',
                              padding: '0 6px',
                              borderRadius: '9px',
                              border: '1px solid #d9d9d9'
                            }}>
                              NEW
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      {room.canJoin && props.allowRoomJoining && (
                        <Tooltip title={`Join "${room.name}"`}>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinRoom(room.id);
                            }}
                            style={{
                              borderRadius: '6px',
                              minWidth: room.isSearchResult ? '80px' : '60px',
                              height: room.isSearchResult ? '30px' : '28px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            {room.isSearchResult ? 'Join Room' : 'Join'}
                          </Button>
                        </Tooltip>
                      )}
                      
                      {room.active && (
                        <Tooltip title="Leave this room">
                          <Popconfirm
                            title="Leave Room"
                            description={`Are you sure you want to leave ${room.name || 'this room'}?`}
                            onConfirm={() => handleLeaveRoom(room.id)}
                            onCancel={() => {/* setRoomToLeave(null); */}}
                            okText="Leave"
                            cancelText="Cancel"
                            placement="bottomRight"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<LogoutOutlined style={{ color: room.active ? '#ffffff' : '#ff4d4f', fontSize: '12px' }} />}
                              style={{ padding: '0', minWidth: 'auto', height: 'auto' }}
                            />
                          </Popconfirm>
                        </Tooltip>
                      )}
                    </div>
                  </RoomItem>
                ))}
              </RoomsSection>
            </div>
          )}
        </div>
      </LeftPanel>

      {/* Right Panel - Chat Area */}
      <RightPanel>
        <ChatHeader $styleConfig={props.style}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                {props.chatName.value}
              </div>
              <div style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>
                {currentRoom?.name || "Default Room"}
              </div>
            </div>
            <div style={{ fontSize: "12px", textAlign: 'right', color: "#666" }}>
              {isConnected ? (
                <span style={{ color: "#52c41a" }}></span>
              ) : (
                <span style={{ color: "#ff4d4f" }}></span>
              )}
              <div style={{ marginTop: '2px' }}>
                
              </div>
            </div>
          </div>
        </ChatHeader>
        
        {/* Leave Room Confirmation */}
        {/* Removed Popconfirm from here as it's now integrated into the room item */}

        <ChatArea ref={chatAreaRef}>
          {messages.length === 0 ? (
            <EmptyState $styleConfig={props.style}>
              <div>💬</div>
              <div>No messages yet</div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                {isConnected ? "Start the conversation!" : "Connecting to chat..."}
              </div>
            </EmptyState>
          ) : (
            messages.map((message: UnifiedMessage) => (
              <MessageBubble
                key={message.id}
                $isOwn={message.authorId === (props.userId.value || "user_123")}
                $styleConfig={props.style}
              >
                <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: "4px" }}>
                  {message.authorName}
                </div>
                {message.text}
                <div style={{ 
                  fontSize: "11px", 
                  opacity: 0.7, 
                  marginTop: "4px",
                  textAlign: message.authorId === (props.userId.value || "user_123") ? "right" : "left"
                }}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </MessageBubble>
            ))
          )}
        </ChatArea>

        {/* Typing Indicators */}
        {typingUsers && typingUsers.length > 0 && (
          <TypingIndicator $styleConfig={props.style}>
            {typingUsers.length === 1 ? (
              <span>
                {typingUsers[0].userName} is typing
                <span className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </span>
            ) : (
              <span>
                {typingUsers.length} people are typing
                <span className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </span>
            )}
          </TypingIndicator>
        )}

        <MessageInput>
          <InputField
            $styleConfig={props.style}
            value={currentMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
          />
          <SendButton
            $styleConfig={props.style}
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || !isConnected}
          >
            Send
          </SendButton>
        </MessageInput>
      </RightPanel>

      {/* Modern Create Room Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusOutlined style={{ color: '#1890ff' }} />
            <span>Create New Room</span>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createRoomForm.resetFields();
        }}
        footer={null}
        width={480}
        centered
        destroyOnHidden
      >
        <Form
          form={createRoomForm}
          layout="vertical"
          onFinish={handleCreateRoom}
          initialValues={{
            roomType: 'public'
          }}
        >
          <Form.Item
            name="roomName"
            label="Room Name"
            rules={[
              { required: true, message: 'Please enter a room name' },
              { min: 2, message: 'Room name must be at least 2 characters' },
              { max: 50, message: 'Room name must be less than 50 characters' }
              // Temporarily disabled for development
              // {
              //   validator: async (_, value) => {
              //     if (!value || value.length < 2) return;
              //     
              //     try {
              //       const allRooms = await chatManager.getAvailableRooms();
              //       const roomExists = allRooms.some((room: any) => 
              //         room.name.toLowerCase() === value.toLowerCase()
              //       );
              //       
              //       if (roomExists) {
              //         throw new Error('A room with this name already exists');
              //       }
              //     } catch (error) {
              //       if (error instanceof Error && error.message.includes('already exists')) {
              //         throw error;
              //       }
              //       // If there's an API error, don't block the validation
              //       console.warn('Could not validate room name uniqueness:', error);
              //     }
              //   }
              // }
            ]}
          >
            <Input 
              placeholder="Enter room name..."
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <Input.TextArea 
              placeholder="What's this room about?"
              rows={3}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="roomType"
            label="Room Type"
          >
            <Radio.Group size="large">
              <Space direction="vertical">
                <Radio value="public">
                  <Space>
                    <GlobalOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <div style={{ fontWeight: '500' }}>Public Room</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        Anyone can discover and join this room
                      </div>
                    </div>
                  </Space>
                </Radio>
                <Radio value="private">
                  <Space>
                    <LockOutlined style={{ color: '#ff7a45' }} />
                    <div>
                      <div style={{ fontWeight: '500' }}>Private Room</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        Only invited members can join this room
                      </div>
                    </div>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  createRoomForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<PlusOutlined />}
                style={{ borderRadius: '6px' }}
              >
                Create Room
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </ChatContainer>
  );
});

// Build the component
let ChatBoxTmpComp = (function () {
  return new UICompBuilder(chatCompChildrenMap, (props) => <ChatBoxView {...props} />)
    .setPropertyViewFn((children) => <ChatPropertyView children={children} />)
    .build();
})();

ChatBoxTmpComp = class extends ChatBoxTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const ChatBoxComp = withExposingConfigs(ChatBoxTmpComp, [
  new NameConfig("chatName", "Chat name displayed in header"),
  new NameConfig("userId", "Unique identifier for current user"),
  new NameConfig("userName", "Display name for current user"),
  new NameConfig("applicationId", "Application scope identifier for room discovery"),
  new NameConfig("roomId", "Initial room to join within application scope"),
  NameConfigHidden,
]);
