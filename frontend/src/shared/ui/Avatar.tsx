interface AvatarProps {
    photoUrl: string | null
    displayName: string
    size?: number
}

export function Avatar({ photoUrl, displayName, size = 96 }: AvatarProps) {
    const style = { width: size, height: size, fontSize: size / 2.5 }

    if (photoUrl) {
        return <img className="avatar" style={style} src={photoUrl} alt={displayName} />
    }
    return (
        <div className="avatar avatar-placeholder" style={style}>
            {displayName.charAt(0).toUpperCase()}
        </div>
    )
}