interface ToastProps {
    status: "info" | "success" | "error"
    message: string
}
export default function Toast({ status, message }: ToastProps) {


    return (
        <div className="toast toast-end m-12">
            {status === "error" && 
                <div className="alert alert-error">
                    <span>{message}</span>
                </div>
            }
            {status === "info" &&            
                <div className="alert alert-info">
                    <span>{message}</span>
                </div>
            }
            {status === "success" && 
                <div className="alert alert-success">
                    <span>{message}</span>
                </div>
            }
        </div>
    )
}