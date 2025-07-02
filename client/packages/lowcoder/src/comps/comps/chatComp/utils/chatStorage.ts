import alasql from "alasql";
import { MyMessage } from "../components/context/ThreadContext";

// Database configuration
const DB_NAME = "ChatDB";
const THREADS_TABLE = "threads";
const MESSAGES_TABLE = "messages";

// Thread data interface
export interface ThreadData {
  threadId: string;
  status: "regular" | "archived";
  title: string;
  createdAt: number;
  updatedAt: number;
}

// Initialize the database
class ChatStorage {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Create database with localStorage backend
      await alasql.promise(`CREATE LOCALSTORAGE DATABASE IF NOT EXISTS ${DB_NAME}`);
      await alasql.promise(`ATTACH LOCALSTORAGE DATABASE ${DB_NAME}`);
      await alasql.promise(`USE ${DB_NAME}`);

      // Create threads table
      await alasql.promise(`
        CREATE TABLE IF NOT EXISTS ${THREADS_TABLE} (
          threadId STRING PRIMARY KEY,
          status STRING,
          title STRING,
          createdAt NUMBER,
          updatedAt NUMBER
        )
      `);

      // Create messages table
      await alasql.promise(`
        CREATE TABLE IF NOT EXISTS ${MESSAGES_TABLE} (
          id STRING PRIMARY KEY,
          threadId STRING,
          role STRING,
          text STRING,
          timestamp NUMBER
        )
      `);

      this.initialized = true;
      console.log("Chat database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize chat database:", error);
      throw error;
    }
  }

  // Thread operations
  async saveThread(thread: ThreadData): Promise<void> {
    await this.initialize();
    
    try {
      // Insert or replace thread
      await alasql.promise(`
        DELETE FROM ${THREADS_TABLE} WHERE threadId = ?
      `, [thread.threadId]);
      
      await alasql.promise(`
        INSERT INTO ${THREADS_TABLE} VALUES (?, ?, ?, ?, ?)
      `, [thread.threadId, thread.status, thread.title, thread.createdAt, thread.updatedAt]);
    } catch (error) {
      console.error("Failed to save thread:", error);
      throw error;
    }
  }

  async getThread(threadId: string): Promise<ThreadData | null> {
    await this.initialize();
    
    try {
      const result = await alasql.promise(`
        SELECT * FROM ${THREADS_TABLE} WHERE threadId = ?
      `, [threadId]) as ThreadData[];
      
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Failed to get thread:", error);
      return null;
    }
  }

  async getAllThreads(): Promise<ThreadData[]> {
    await this.initialize();
    
    try {
      const result = await alasql.promise(`
        SELECT * FROM ${THREADS_TABLE} ORDER BY updatedAt DESC
      `) as ThreadData[];
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Failed to get threads:", error);
      return [];
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.initialize();
    
    try {
      // Delete thread and all its messages
      await alasql.promise(`DELETE FROM ${THREADS_TABLE} WHERE threadId = ?`, [threadId]);
      await alasql.promise(`DELETE FROM ${MESSAGES_TABLE} WHERE threadId = ?`, [threadId]);
    } catch (error) {
      console.error("Failed to delete thread:", error);
      throw error;
    }
  }

  // Message operations
  async saveMessage(message: MyMessage, threadId: string): Promise<void> {
    await this.initialize();
    
    try {
      // Insert or replace message
      await alasql.promise(`
        DELETE FROM ${MESSAGES_TABLE} WHERE id = ?
      `, [message.id]);
      
      await alasql.promise(`
        INSERT INTO ${MESSAGES_TABLE} VALUES (?, ?, ?, ?, ?)
      `, [message.id, threadId, message.role, message.text, message.timestamp]);
    } catch (error) {
      console.error("Failed to save message:", error);
      throw error;
    }
  }

  async saveMessages(messages: MyMessage[], threadId: string): Promise<void> {
    await this.initialize();
    
    try {
      // Delete existing messages for this thread
      await alasql.promise(`DELETE FROM ${MESSAGES_TABLE} WHERE threadId = ?`, [threadId]);
      
      // Insert all messages
      for (const message of messages) {
        await alasql.promise(`
          INSERT INTO ${MESSAGES_TABLE} VALUES (?, ?, ?, ?, ?)
        `, [message.id, threadId, message.role, message.text, message.timestamp]);
      }
    } catch (error) {
      console.error("Failed to save messages:", error);
      throw error;
    }
  }

  async getMessages(threadId: string): Promise<MyMessage[]> {
    await this.initialize();
    
    try {
      const result = await alasql.promise(`
        SELECT id, role, text, timestamp FROM ${MESSAGES_TABLE} 
        WHERE threadId = ? ORDER BY timestamp ASC
      `, [threadId]) as MyMessage[];
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Failed to get messages:", error);
      return [];
    }
  }

  async deleteMessages(threadId: string): Promise<void> {
    await this.initialize();
    
    try {
      await alasql.promise(`DELETE FROM ${MESSAGES_TABLE} WHERE threadId = ?`, [threadId]);
    } catch (error) {
      console.error("Failed to delete messages:", error);
      throw error;
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await this.initialize();
    
    try {
      await alasql.promise(`DELETE FROM ${THREADS_TABLE}`);
      await alasql.promise(`DELETE FROM ${MESSAGES_TABLE}`);
    } catch (error) {
      console.error("Failed to clear all data:", error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      // Drop the entire database
      await alasql.promise(`DROP LOCALSTORAGE DATABASE IF EXISTS ${DB_NAME}`);
      this.initialized = false;
      
      // Reinitialize fresh
      await this.initialize();
      console.log("✅ Database reset and reinitialized");
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    }
  }

  async clearOnlyMessages(): Promise<void> {
    await this.initialize();
    
    try {
      await alasql.promise(`DELETE FROM ${MESSAGES_TABLE}`);
      console.log("✅ All messages cleared, threads preserved");
    } catch (error) {
      console.error("Failed to clear messages:", error);
      throw error;
    }
  }

  async clearOnlyThreads(): Promise<void> {
    await this.initialize();
    
    try {
      await alasql.promise(`DELETE FROM ${THREADS_TABLE}`);
      await alasql.promise(`DELETE FROM ${MESSAGES_TABLE}`); // Clear orphaned messages
      console.log("✅ All threads and messages cleared");
    } catch (error) {
      console.error("Failed to clear threads:", error);
      throw error;
    }
  }

  async exportData(): Promise<{ threads: ThreadData[]; messages: any[] }> {
    await this.initialize();
    
    try {
      const threads = await this.getAllThreads();
      const messages = await alasql.promise(`SELECT * FROM ${MESSAGES_TABLE}`) as any[];
      
      return { threads, messages: Array.isArray(messages) ? messages : [] };
    } catch (error) {
      console.error("Failed to export data:", error);
      throw error;
    }
  }

  async importData(data: { threads: ThreadData[]; messages: any[] }): Promise<void> {
    await this.initialize();
    
    try {
      // Clear existing data
      await this.clearAllData();
      
      // Import threads
      for (const thread of data.threads) {
        await this.saveThread(thread);
      }
      
      // Import messages
      for (const message of data.messages) {
        await alasql.promise(`
          INSERT INTO ${MESSAGES_TABLE} VALUES (?, ?, ?, ?, ?)
        `, [message.id, message.threadId, message.role, message.text, message.timestamp]);
      }
    } catch (error) {
      console.error("Failed to import data:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatStorage = new ChatStorage(); 