export default function List() {

    const games = ["Running","Games","Reading","Watching Movies","Listening to Music"];
    const listGames = games.map(game => <li style={{textAlign:"left"}}>{game}</li>)

    return (
        <div>
            <h3>Hobbies:</h3>
            <ol>{listGames}</ol>
            <div style={{height:"50px"}}></div>
        </div>
    );

}

