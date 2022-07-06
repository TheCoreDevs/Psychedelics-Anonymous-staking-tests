const Web3 = require('web3')
const chai = require('chai')
const assert = chai.assert
const BigNumber = require('bignumber.js')
const { time } = require("@openzeppelin/test-helpers");

const PAStakerSrc = require('../build/contracts/PAStaker.json')
const GenesisTokenSrc = require('../build/contracts/mockGenesis.json')
const C1TokenSrc = require('../build/contracts/mockC1.json')
const PsilocyTokenSrc = require('../build/contracts/mockPsilocybin.json')

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
web3.transactionConfirmationBlocks = 1;

function range(start, end) {
  return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

describe('test unstake 2', function () {

  let PAStaker
  let GenesisToken
  let C1Token
  let PsilocyToken
  let accounts
  

  beforeEach(async() => {
    accounts = await web3.eth.getAccounts()
    GenesisToken = new web3.eth.Contract(GenesisTokenSrc.abi)
    C1Token = new web3.eth.Contract(C1TokenSrc.abi)
    PsilocyToken = new web3.eth.Contract(C1TokenSrc.abi)
    PAStaker = new web3.eth.Contract(PAStakerSrc.abi)
    

    // let args = [200, 300, 1000, 1500, 2000, 5000, accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]]

    GenesisToken = await GenesisToken.deploy({data: GenesisTokenSrc.bytecode}).send({from: accounts[0], gas: 10000000})
    C1Token = await C1Token.deploy({data: C1TokenSrc.bytecode}).send({from: accounts[0], gas: 10000000})
    PsilocyToken = await PsilocyToken.deploy({data: PsilocyTokenSrc.bytecode}).send({from: accounts[0], gas: 10000000})
    let stakerArgs = [GenesisToken.options.address, C1Token.options.address, PsilocyToken.options.address]
    PAStaker = await PAStaker.deploy({data: PAStakerSrc.bytecode, arguments: stakerArgs}).send({from: accounts[0], gas: 10000000})

    let j = 1
    while(j < 10) { // mint 10 tokens to accounts 1 through 9
      await GenesisToken.methods.mint(10).send({from: accounts[j], gas:10000000});
      await C1Token.methods.mint(10).send({from: accounts[j], gas:10000000});
      await PsilocyToken.methods.mint(10).send({from: accounts[j], gas:10000000});
      j++
    }
    
    let i = 0;
    while(i < 10) { // set approval for all accounts
      await GenesisToken.methods.setApprovalForAll(PAStaker.options.address, true).send({from: accounts[i], gas:10000000});
      await C1Token.methods.setApprovalForAll(PAStaker.options.address, true).send({from: accounts[i], gas:10000000});
      await PsilocyToken.methods.setApprovalForAll(PAStaker.options.address, true).send({from: accounts[i], gas:10000000});
      i++
    }
    
  })

  it('genesis should not let to batch unstake from another account', async() => {
    let contractId = 0

    let tokenIds = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds, contractId).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.batchUnstake(tokenIds, contractId).send({from: accounts[2], gas:10000000});
      throw('cannot reach this')
    } catch(e) {
      assert(e.message.includes('revert'))
    }
    

    for(let i = 1; i <= 10; i++) {
      let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == true, "is staked: failed to stake on ID: " + i);
    }
  })

  it('c1 should not let to batch unstake from another account', async() => {
    let contractId = 1

    let tokenIds = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds, contractId).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.batchUnstake(tokenIds, contractId).send({from: accounts[2], gas:10000000});
      throw('cannot reach this')
    } catch(e) {
      assert(e.message.includes('revert'))
    }
    

    for(let i = 1; i <= 10; i++) {
      let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == true, "is staked: failed to stake on ID: " + i);
    }
  })

  it('psisocy should not let to batch unstake from another account', async() => {
    let contractId = 2

    let tokenIds = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds, contractId).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.batchUnstake(tokenIds, contractId).send({from: accounts[2], gas:10000000});
      throw('cannot reach this')
    } catch(e) {
      assert(e.message.includes('revert'))
    }
    

    for(let i = 1; i <= 10; i++) {
      let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == true, "is staked: failed to stake on ID: " + i);
    }
  })

  it('genesis should not let to unstake from another account', async() => {
    let contractId = 0

    await GenesisToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.unstake(1, contractId).send({from: accounts[2], gas:10000000});
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }

    let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, 1).call();
    assert(isStaked == true, "is staked: allowed to unstake");
  })


  it('c1 should not let to unstake from another account', async() => {
    let contractId = 1

    await C1Token.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.unstake(1, contractId).send({from: accounts[2], gas:10000000});
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }

    let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, 1).call();
    assert(isStaked == true, "is staked: allowed to unstake");
  })

  it('Psilocy should not let to unstake from another account', async() => {
    let contractId = 2

    await PsilocyToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.unstake(1, contractId).send({from: accounts[2], gas:10000000});
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }

    let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, 1).call();
    assert(isStaked == true, "is staked: allowed to unstake");
  })

  it('genesis should not let non delegates to unstake - delegated single', async() => {
    let contractId = 0

    await GenesisToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.delegatedUnstake(1, contractId).send({from: accounts[1], gas:10000000});
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }

    let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, 1).call();
    assert(isStaked == true, "is staked: allowed to unstake");
  })

  it('c1 should not let non delegates to unstake - delegated single', async() => {
    let contractId = 1

    await C1Token.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.delegatedUnstake(1, contractId).send({from: accounts[1], gas:10000000});
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }

    let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, 1).call();
    assert(isStaked == true, "is staked: allowed to unstake");
  })

  it('Psilocy should not let non delegates to unstake - delegated single', async() => {
    let contractId = 2

    await PsilocyToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    try {
      await PAStaker.methods.delegatedUnstake(1, contractId).send({from: accounts[1], gas:10000000});
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }

    let isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, 1).call();
    assert(isStaked == true, "is staked: allowed to unstake");
  })

  it('should not let non delegates to unstake genesis - delegated batch', async() => {
    let contractId = 0;

    let tokenIds1 = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds1, contractId).send({from: accounts[1], gas:10000000});
    let tokenIds2 = range(11, 20)
    await PAStaker.methods.batchStake(tokenIds2, contractId).send({from: accounts[2], gas:10000000});
    let tokenIds3 = range(21, 30)
    await PAStaker.methods.batchStake(tokenIds3, contractId).send({from: accounts[3], gas:10000000});

    try {
      await PAStaker.methods.delegatedBatchUnstake(range(1,30), contractId).send({from: accounts[1], gas:10000000});      throw('cannot reach this')
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }
    
    let isStaked
    for(let i = 1; i <= 10; i++) {
      isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[2], contractId, i + 10).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + (i + 10));
      isStaked = await PAStaker.methods.isStaked(accounts[3], contractId, i + 20).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + (i + 20));
    }
  })

  it('should not let non delegates to unstake c1 - delegated batch', async() => {
    let contractId = 1;

    let tokenIds1 = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds1, contractId).send({from: accounts[1], gas:10000000});
    let tokenIds2 = range(11, 20)
    await PAStaker.methods.batchStake(tokenIds2, contractId).send({from: accounts[2], gas:10000000});
    let tokenIds3 = range(21, 30)
    await PAStaker.methods.batchStake(tokenIds3, contractId).send({from: accounts[3], gas:10000000});

    try {
      await PAStaker.methods.delegatedBatchUnstake(range(1,30), contractId).send({from: accounts[1], gas:10000000});      throw('cannot reach this')
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }
    
    let isStaked
    for(let i = 1; i <= 10; i++) {
      isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[2], contractId, i + 10).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + (i + 10));
      isStaked = await PAStaker.methods.isStaked(accounts[3], contractId, i + 20).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + (i + 20));
    }
  })

  it('should not let non delegates to unstake Psilocy - delegated batch', async() => {
    let contractId = 2;

    let tokenIds1 = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds1, contractId).send({from: accounts[1], gas:10000000});
    let tokenIds2 = range(11, 20)
    await PAStaker.methods.batchStake(tokenIds2, contractId).send({from: accounts[2], gas:10000000});
    let tokenIds3 = range(21, 30)
    await PAStaker.methods.batchStake(tokenIds3, contractId).send({from: accounts[3], gas:10000000});

    try {
      await PAStaker.methods.delegatedBatchUnstake(range(1,30), contractId).send({from: accounts[1], gas:10000000});      throw('cannot reach this')
      throw('cannot reach this')
    } catch (e) {
      assert(e.message.includes('revert'))
    }
    
    let isStaked
    for(let i = 1; i <= 10; i++) {
      isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[2], contractId, i + 10).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + (i + 10));
      isStaked = await PAStaker.methods.isStaked(accounts[3], contractId, i + 20).call();
      assert(isStaked == true, "is staked: allowed to unstake on ID: " + (i + 20));
    }
  })

  
})