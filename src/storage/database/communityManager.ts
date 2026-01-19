import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { communityPosts, comments, likes, insertCommunityPostSchema, updateCommunityPostSchema } from "./shared/schema";
import type { CommunityPost, InsertCommunityPost, UpdateCommunityPost, Comment, Like } from "./shared/schema";

export class CommunityManager {
  // Post methods
  async createPost(data: InsertCommunityPost): Promise<CommunityPost> {
    const db = await getDb();
    const validated = insertCommunityPostSchema.parse(data);
    const [post] = await db.insert(communityPosts).values(validated).returning();
    return post;
  }

  async getPosts(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<CommunityPost, 'id' | 'userId' | 'orderId' | 'language' | 'status'>>;
  } = {}): Promise<CommunityPost[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(communityPosts.id, filters.id));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(communityPosts.userId, filters.userId));
    }
    if (filters.orderId !== undefined && filters.orderId !== null) {
      conditions.push(eq(communityPosts.orderId, filters.orderId));
    }
    if (filters.language !== undefined) {
      conditions.push(eq(communityPosts.language, filters.language));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(communityPosts.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(communityPosts)
      .where(whereClause)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(communityPosts.createdAt));
  }

  async getPostById(id: string): Promise<CommunityPost | null> {
    const db = await getDb();
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post || null;
  }

  async updatePost(id: string, data: UpdateCommunityPost): Promise<CommunityPost | null> {
    const db = await getDb();
    const validated = updateCommunityPostSchema.parse(data);
    const [post] = await db
      .update(communityPosts)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(communityPosts.id, id))
      .returning();
    return post || null;
  }

  async deletePost(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(communityPosts).where(eq(communityPosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementLikesCount(postId: string): Promise<CommunityPost | null> {
    const db = await getDb();
    const [post] = await db
      .update(communityPosts)
      .set({
        likesCount: sql`${communityPosts.likesCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    return post || null;
  }

  async decrementLikesCount(postId: string): Promise<CommunityPost | null> {
    const db = await getDb();
    const [post] = await db
      .update(communityPosts)
      .set({
        likesCount: sql`GREATEST(${communityPosts.likesCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    return post || null;
  }

  async incrementCommentsCount(postId: string): Promise<CommunityPost | null> {
    const db = await getDb();
    const [post] = await db
      .update(communityPosts)
      .set({
        commentsCount: sql`${communityPosts.commentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    return post || null;
  }

  async decrementCommentsCount(postId: string): Promise<CommunityPost | null> {
    const db = await getDb();
    const [post] = await db
      .update(communityPosts)
      .set({
        commentsCount: sql`GREATEST(${communityPosts.commentsCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    return post || null;
  }

  // Comment methods
  async createComment(postId: string, userId: string, content: string, parentId?: string): Promise<any> {
    const db = await getDb();
    const result = await db.insert(comments).values({
      postId,
      userId,
      content,
      parentId,
    }).returning();

    // Increment comments count on post
    await this.incrementCommentsCount(postId);

    return result[0];
  }

  async getCommentsByPostId(postId: string): Promise<any[]> {
    const db = await getDb();
    return db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }

  async deleteComment(id: string): Promise<boolean> {
    const db = await getDb();
    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);

    if (comment) {
      await this.decrementCommentsCount(comment.postId);
      const result = await db.delete(comments).where(eq(comments.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    return false;
  }

  // Like methods
  async likePost(postId: string, userId: string): Promise<Like> {
    const db = await getDb();
    const [like] = await db.insert(likes).values({
      postId,
      userId,
    }).returning();

    await this.incrementLikesCount(postId);

    return like;
  }

  async unlikePost(postId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(likes)
      .where(
        and(
          eq(likes.postId, postId),
          eq(likes.userId, userId)
        )
      );

    if (result.rowCount && result.rowCount > 0) {
      await this.decrementLikesCount(postId);
      return true;
    }

    return false;
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.postId, postId),
          eq(likes.userId, userId)
        )
      )
      .limit(1);

    return !!like;
  }

  async getTotalPostsCount(): Promise<number> {
    const db = await getDb();
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(communityPosts);
    return result[0]?.count ?? 0;
  }
}

export const communityManager = new CommunityManager();
