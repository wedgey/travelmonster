<?php
	use \Psr\Http\Message\ServerRequestInterface as Request;
	use \Psr\Http\Message\ResponseInterface as Response;

	require __DIR__.'/../lib/user.php';

	//User Registration
	$app->post('/user/register', function (Request $request, Response $response) {
		$creds = $request->getParsedBody();
		$user = new User();
	    $status = $user->register($creds);
	    if($status) {
			if($user->login($creds['email'],$creds['password']) === true) {
				$json_token = $user->generateToken();
				return $response->write($json_token);
			} else {
				return $response->write($user->error_msg);
			}
	    }
	});

	//User Login
	$app->post('/user/login', function (Request $request, Response $response) {
		$creds = $request->getParsedBody();
		$user = new User();
		if($user->login($creds['email'],$creds['password'])) {
			$json_token = $user->generateToken();
			return $response->write($json_token);
		} else {
			return $response->write($user->error_msg);
		}
	});

	//Refresh token
	$app->get('/user/tokenrefresh', function(Request $request, Response $response) {
		$token = $this->jwt;
		$tokendata = (array) $token->data;
		$user = new User();
		$refresh_token = $user->generateToken($tokendata);
		return $response->write($refresh_token);
	});

	//Retrieve details of current account
	$app->get('/user/getaccount', function (Request $request, Response $response) {
		$token = $this->jwt;
		$creds = $token->data->id;
		$user = getUserInfo($creds);
		if(count($user) == 1) {
			$user[0]['password'] = "";
			return $response->withJson($user[0]);
		}
	});

	//Tour Guide Registration
	$app->post('/user/registerguide', function(Request $request, Response $response) {
		$token = $this->jwt;
		$userid = $token->data->id;
		$creds = $request->getParsedBody();

		$result = registerGuide($userid, $creds);
		if($result === true) {
			$tokendata = (array) $token->data;
			$tokendata['numoftourguides'] = "1";
			$refresh_token = generateToken($tokendata);
			return $response->write($refresh_token);
		} else {
			return $response->withJson($result);
		}
	});

?>