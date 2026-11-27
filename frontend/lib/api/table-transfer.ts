// lib/api/table-transfer.ts
import { get, post } from "@/lib/api/client";

export interface TransferResult {
   message: string;
   order_id: number | null;
   order_ref: string | null;
   from_table: { id: number; name: string; status: string };
   to_table: { id: number; name: string; status: string };
}

export interface MergeResult {
   message: string;
   order_id: number | null;
   order_ref: string | null;
   total: number;
   primary_table: string;
   tables: string[];
}

export interface TableOrderItem {
   id: number;
   menu_item_id: number;
   name: string;
   price: number;
   quantity: number;
   original_price?: number | null;
   discount_name?: string | null;
   discount_value?: number | null;
   discount_value_type?: string | null;
}

export interface TableOrderResult {
   order: {
      id: number;
      order_ref: string;
      table_name: string;
      total: number;
      status: string;
      items: TableOrderItem[];
   };
   merged_table_ids: number[];
   merged_table_names: string[];
}

/** Move a customer (and their order) to an EMPTY table. */
export const transferTable = (fromTableId: number, toTableId: number) =>
   post("/pos/tables/transfer", {
      from_table_id: fromTableId,
      to_table_id: toTableId,
   }) as unknown as Promise<TransferResult>;

/** Merge source table's order into target table's order (one bill). */
export const mergeTables = (sourceTableId: number, targetTableId: number) =>
   post("/pos/tables/merge", {
      from_table_id: sourceTableId,
      to_table_id: targetTableId,
   }) as unknown as Promise<MergeResult>;

/** Real bill of a table. Any merged table (A, B, C) returns the SAME order + all items. */
export const fetchTableOrder = (tableId: number) =>
   get(`/pos/tables/${tableId}/order`) as unknown as Promise<TableOrderResult>;