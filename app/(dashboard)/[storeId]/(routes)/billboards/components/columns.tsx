"use client"

import { CellAction } from "@/app/(dashboard)/[storeId]/(routes)/billboards/components/cell-action"
import { ColumnDef } from "@tanstack/react-table"
import { ro } from "date-fns/locale"


export type BillboardColumn = {
  id: string
  label: string
  createdAt: string

}

export const columns: ColumnDef<BillboardColumn>[] = [
  {
    accessorKey: "label",
    header: "Label",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: 'actions',
    cell: ({row}) => <CellAction data={row.original}/>
  }
]
