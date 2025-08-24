import { db } from "../server/db";
import { users } from "@shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function createDefaultOperator() {
  try {
    const operatorUsername = process.env.OPERATOR_USERNAME || 'operator';
    const operatorPassword = process.env.OPERATOR_PASSWORD || 'ert2025!';

    const existingOperator = await db
      .select()
      .from(users)
      .where(eq(users.username, operatorUsername))
      .limit(1);

    if (existingOperator.length > 0) {
      console.log('Default operator user already exists');
      return;
    }

    const hashedPassword = await hashPassword(operatorPassword);

    const [newOperator] = await db
      .insert(users)
      .values({
        username: operatorUsername,
        password: hashedPassword,
        role: 'operator',
      })
      .returning();

    console.log('Default operator created successfully');
    console.log('Username:', operatorUsername);
    console.log('Password:', operatorPassword);
    console.log('Role:', newOperator.role);

  } catch (error) {
    console.error('Error creating default operator:', error);
  }
}

createDefaultOperator().then(() => process.exit(0));

export { createDefaultOperator };