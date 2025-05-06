import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user";

@Entity("user_audit_logs")
export class UserAuditLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "target_user_id" })
    targetUser: User;

    @Column()
    target_user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "performed_by_id" })
    performedBy: User;

    @Column()
    performed_by_id: string;

    @Column("varchar", { length: 50 })
    action: 'role_update' | 'status_update' | 'removal';

    @Column("jsonb")
    changes: {
        previous?: {
            role?: string;
            status?: string;
        };
        new?: {
            role?: string;
            status?: string;
        };
    };

    @Column("text", { nullable: true })
    reason: string;

    @CreateDateColumn()
    created_at: Date;
}