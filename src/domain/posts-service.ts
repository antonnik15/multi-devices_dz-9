import {postsRepository} from "../repositories/posts-repositories/posts-repository";


export const postsService = {
    async createPost(title: string, shortDescription: string, content: string, blogId: string) : Promise<string> {
        const newPost = {
            id: (+new Date()).toString(),
            title: title,
            shortDescription: shortDescription,
            content: content,
            blogId: blogId,
            blogName: "Travelling",
            createdAt: (new Date()).toISOString()
        }
        await postsRepository.createPost(newPost)
        return newPost.id
    },
    async updatePost(id: string, title: string, shortDescription: string, content: string, blogId: string) : Promise<number>{
        return await postsRepository.updatePost(id, title, shortDescription, content, blogId)
    },
    async deletePostById(id: string) : Promise<number>{
        return postsRepository.deletePostById(id)
    }
}
