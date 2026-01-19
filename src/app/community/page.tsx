"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Heart, Search, Plus, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/locales";

interface Post {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  language: string;
  likesCount: number;
  commentsCount: number;
  status: string;
  createdAt: string;
}

export default function CommunityPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/community/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Implement search logic
    console.log("Searching for:", searchKeyword);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t.community?.title || "Community"}
              </h1>
              <p className="text-gray-600">
                {t.community?.subtitle || "Connect with other patients and share experiences"}
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.community?.newPost || "New Post"}
            </Button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder={t.community?.searchPlaceholder || "Search posts..."}
            className="pl-10 py-6"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.common?.loading || "Loading..."}</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">
              {t.community?.noPosts || "No posts yet"}
            </CardTitle>
            <CardDescription className="mb-6">
              {t.community?.noPostsDesc || "Be the first to share your medical tourism experience"}
            </CardDescription>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.community?.createFirstPost || "Create First Post"}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {post.userName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span>{post.userName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {post.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      {post.likesCount}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {post.commentsCount}
                    </Button>
                  </div>
                  <Badge variant="outline">{post.language}</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
