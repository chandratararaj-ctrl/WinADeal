declare namespace Express {
    export interface Request {
        user?: {
            userId: string;
            roles: string[];
            selectedRole: string;
        };
        files?: any;
    }
    export namespace Multer {
        export interface File {
            fieldname: string;
            originalname: string;
            encoding: string;
            mimetype: string;
            size: number;
            destination: string;
            filename: string;
            path: string;
            buffer: Buffer;
        }
    }
}
