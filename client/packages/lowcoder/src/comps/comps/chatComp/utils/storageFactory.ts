// client/packages/lowcoder/src/comps/comps/chatComp/utils/storageFactory.ts

import alasql from "alasql";
import { ChatMessage, ChatThread, ChatStorage } from "../types/chatTypes";

// ============================================================================
// CLEAN STORAGE FACTORY (simplified from your existing implementation)
// ============================================================================

export function createChatStorage(tableName: string): ChatStorage {
  const dbName = `ChatDB_${tableName}`;
  const threadsTable = `${dbName}.threads`;
  const messagesTable = `${dbName}.messages`;
  
  return {
    async initialize() {
      try {
        // Create database with localStorage backend
        await alasql.promise(`CREATE LOCALSTORAGE DATABASE IF NOT EXISTS ${dbName}`);
        await alasql.promise(`ATTACH LOCALSTORAGE DATABASE ${dbName}`);

        // Create threads table
        await alasql.promise(`
          CREATE TABLE IF NOT EXISTS ${threadsTable} (
            threadId STRING PRIMARY KEY,
            status STRING,
            title STRING,
            createdAt NUMBER,
            updatedAt NUMBER
          )
        `);

        // Create messages table
        await alasql.promise(`
          CREATE TABLE IF NOT EXISTS ${messagesTable} (
            id STRING PRIMARY KEY,
            threadId STRING,
            role STRING,
            text STRING,
            timestamp NUMBER,
            attachments STRING
          )
        `);

      } catch (error) {
        console.error(`Failed to initialize chat database ${dbName}:`, error);
        throw error;
      }
    },

    async saveThread(thread: ChatThread) {
      try {
        // Insert or replace thread
        await alasql.promise(`DELETE FROM ${threadsTable} WHERE threadId = ?`, [thread.threadId]);
        
        await alasql.promise(`
          INSERT INTO ${threadsTable} VALUES (?, ?, ?, ?, ?)
        `, [thread.threadId, thread.status, thread.title, thread.createdAt, thread.updatedAt]);
      } catch (error) {
        console.error("Failed to save thread:", error);
        throw error;
      }
    },

    async getThread(threadId: string) {
      try {
        const result = await alasql.promise(`
          SELECT * FROM ${threadsTable} WHERE threadId = ?
        `, [threadId]) as ChatThread[];
        
        return result && result.length > 0 ? result[0] : null;
      } catch (error) {
        console.error("Failed to get thread:", error);
        return null;
      }
    },

    async getAllThreads() {
      try {
        const result = await alasql.promise(`
          SELECT * FROM ${threadsTable} ORDER BY updatedAt DESC
        `) as ChatThread[];
        
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Failed to get threads:", error);
        return [];
      }
    },

    async deleteThread(threadId: string) {
      try {
        // Delete thread and all its messages
        await alasql.promise(`DELETE FROM ${threadsTable} WHERE threadId = ?`, [threadId]);
        await alasql.promise(`DELETE FROM ${messagesTable} WHERE threadId = ?`, [threadId]);
      } catch (error) {
        console.error("Failed to delete thread:", error);
        throw error;
      }
    },

    async saveMessage(message: ChatMessage, threadId: string) {
      try {
        // Insert or replace message
        await alasql.promise(`DELETE FROM ${messagesTable} WHERE id = ?`, [message.id]);
        
        await alasql.promise(`
          INSERT INTO ${messagesTable} VALUES (?, ?, ?, ?, ?, ?)
        `, [message.id, threadId, message.role, message.text, message.timestamp, JSON.stringify(message.attachments || [])]);
      } catch (error) {
        console.error("Failed to save message:", error);
        throw error;
      }
    },

    async saveMessages(messages: ChatMessage[], threadId: string) {
      try {
        // Delete existing messages for this thread
        await alasql.promise(`DELETE FROM ${messagesTable} WHERE threadId = ?`, [threadId]);
        
        // Insert all messages
        for (const message of messages) {
          await alasql.promise(`
            INSERT INTO ${messagesTable} VALUES (?, ?, ?, ?, ?, ?)
          `, [message.id, threadId, message.role, message.text, message.timestamp, JSON.stringify(message.attachments || [])]);
        }
      } catch (error) {
        console.error("Failed to save messages:", error);
        throw error;
      }
    },

    async getMessages(threadId: string) {
      try {
        const result = await alasql.promise(`
          SELECT id, role, text, timestamp, attachments FROM ${messagesTable} 
          WHERE threadId = ? ORDER BY timestamp ASC
        `, [threadId]) as any[];
        
        return result.map(row => ({
          id: row.id,
          role: row.role,
          text: row.text,
          timestamp: row.timestamp,
          attachments: JSON.parse(row.attachments || '[]')
        })) as ChatMessage[];
      } catch (error) {
        console.error("Failed to get messages:", error);
        return [];
      }
    },

    async deleteMessages(threadId: string) {
      try {
        await alasql.promise(`DELETE FROM ${messagesTable} WHERE threadId = ?`, [threadId]);
      } catch (error) {
        console.error("Failed to delete messages:", error);
        throw error;
      }
    },

    async clearAllData() {
      try {
        await alasql.promise(`DELETE FROM ${threadsTable}`);
        await alasql.promise(`DELETE FROM ${messagesTable}`);
      } catch (error) {
        console.error("Failed to clear all data:", error);
        throw error;
      }
    },

    async resetDatabase() {
      try {
        // Drop the entire database
        await alasql.promise(`DROP LOCALSTORAGE DATABASE IF EXISTS ${dbName}`);
        
        // Reinitialize fresh
        await this.initialize();
      } catch (error) {
        console.error("Failed to reset database:", error);
        throw error;
      }
    },
    async cleanup() {
      try {
        await alasql.promise(`DROP LOCALSTORAGE DATABASE IF EXISTS ${dbName}`);
      } catch (error) {
        console.error("Failed to cleanup database:", error);
        throw error;
      }
    }
  };
}