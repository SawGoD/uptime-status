const Link = (props = { text, to }) => {
    return (
        <a {...props} href={props.to} target="_blank" rel="noopener noreferrer">
            {props.text}
        </a>
    )
}

export default Link
