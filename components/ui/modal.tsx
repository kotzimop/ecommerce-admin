'use client'
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle } 
from "./dialog"

interface ModalProps {
    title: string
    description: string
    isOpen: boolean
    onCLose: () => void
    children?: React.ReactNode
}

export const Modal:React.FC<ModalProps> = ({
    title, 
    description, 
    isOpen, 
    onCLose, 
    children
}) => {
    const onChange = (open: boolean) => {
        if(!open) {
            onCLose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div>
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}