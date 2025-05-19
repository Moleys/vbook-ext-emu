load('legado-bs.js');
load('legado.js');
load('function.js');
load('config.js');

function execute() {
    let exploreUrl = bs.exploreUrl;
    let lines = exploreUrl.split("\n");
    let categories = lines.map(line => {
        let [title, path] = line.split("::");
        return {
            title: title,
            input: BASE_URL + path,
            script: "gen.js"
        };
    });
    return Response.success(categories);

}