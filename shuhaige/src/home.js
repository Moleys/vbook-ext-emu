load('legado-bs.js');
load('legado.js');
load('function.js');
load('config.js');

function execute() {
    let exploreUrl = bs.exploreUrl;
    let firstLine = exploreUrl.split("\n")[0];  // Lấy dòng đầu tiên
    let [title, path] = firstLine.split("::");

    return Response.success([
        {
            title: title,
            input: BASE_URL + path,
            script: "gen.js"
        }
    ]);


}