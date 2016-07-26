<?php
	use \Psr\Http\Message\ServerRequestInterface as Request;
	use \Psr\Http\Message\ResponseInterface as Response;
	use \Slim\Middleware\HttpBasicAuthentication\AuthenticatorInterface;
	use \Firebase\JWT\JWT;

	require 'vendor/autoload.php';

	$configuration = [
    'settings' => [
        'displayErrorDetails' => true,
    ],
];
$c = new \Slim\Container($configuration);
$app = new \Slim\App($c);
$container = $app->getContainer();

$container["jwt"] = function ($container) {
    return new StdClass;
};

	$config = parse_ini_file('lib/config.ini');
	$jwt = "";
	
	//Load JWT auth middleware
	$app->add(new \Slim\Middleware\JwtAuthentication([
    	"secret" => $config['jwt_secret_key'],
    	"secure" => false,
    	"rules" =>  [
    		new \Slim\Middleware\JwtAuthentication\RequestPathRule([
	    		"path" => "/",
	    		"passthrough" => ["/user/login", "/user/register"],
	    		"environment" => ["HTTP_AUTHORIZATION", "REDIRECT_HTTP_AUTHORIZATION"],
	    	])
    	],
    	"callback" => function($request, $response, $arguments) use ($container) {
    		$container["jwt"] = $arguments["decoded"];
    	},
    	"error" => function($request, $response, $arguments) {
    		return $response->write("Error");
    	}
    ]));
	
	$app->get('/hello/{name}', function (Request $request, Response $response) {
	    $name = $request->getAttribute('name');
	    $now = new DateTime();
	    $now_result = $now->format('Y-m-d H:i:s');
	    $future = new DateTime("now +4 hours");
	    $result = $future->format('Y-m-d H:i:s');
	    $response->getBody()->write('Now: '.$now_result.'<br> Later: '.$result);

	    return $response;
	});

	require 'routes/user.php';
	require 'routes/tours.php';
	$app->run();
?>